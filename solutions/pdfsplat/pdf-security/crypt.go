package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"github.com/pdfcpu/pdfcpu/pkg/api"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
	"io"
	"time"
)

const maxInput = 16 << 20
const maxOutput = 32 << 20

type boundedBuffer struct{ bytes.Buffer }

func (b *boundedBuffer) Write(p []byte) (int, error) {
	if b.Len()+len(p) > maxOutput {
		return 0, errors.New("PDF output exceeds 32 MiB limit")
	}
	return b.Buffer.Write(p)
}

func cryptPDF(operation string, input []byte, password string) ([]byte, error) {
	if len(input) == 0 || len(input) > maxInput {
		return nil, errors.New("Choose a PDF up to 16 MiB")
	}
	if len(password) < 1 || (operation == "encrypt" && len(password) < 8) || len(password) > 127 {
		return nil, errors.New("Use a password of 8–127 UTF-8 bytes")
	}
	config := model.NewStatelessConfiguration()
	config.UserPW = password
	config.OwnerPW = password
	config.EncryptUsingAES = true
	config.EncryptKeyLength = 256
	config.Permissions = model.PermissionsAll
	config.Limits = model.ResourceLimits{MaxInputBytes: maxInput, MaxObjectBytes: 4 << 20, MaxStreamBytes: 16 << 20, MaxDecodeBytes: 64 << 20, MaxImagePixels: 16000000, MaxImageBytes: 64 << 20, MaxObjectCount: 100000, MaxObjectStreamCount: 10000, MaxObjectStreamFirst: 4 << 20, MaxXRefEntries: 100000, MaxRecursionDepth: 100}
	config.ValidateLinks = false
	config.Offline = true
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	out := &boundedBuffer{}
	var err error
	switch operation {
	case "encrypt":
		owner := make([]byte, 32)
		if _, err = io.ReadFull(rand.Reader, owner); err != nil {
			return nil, err
		}
		config.OwnerPW = base64.RawURLEncoding.EncodeToString(owner)
		clear(owner)
		err = api.Encrypt(ctx, bytes.NewReader(input), out, config)
	case "decrypt":
		err = api.Decrypt(ctx, bytes.NewReader(input), out, config)
	default:
		return nil, errors.New("Unsupported PDF security operation")
	}
	config.UserPW = ""
	config.OwnerPW = ""
	if err != nil {
		return nil, err
	}
	return out.Bytes(), nil
}
