package main

import (
	"bytes"
	"context"
	"fmt"
	"github.com/pdfcpu/pdfcpu/pkg/api"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
	"strings"
	"testing"
)

func fixture() []byte {
	objects := []string{"<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 500] /Resources << >> /Contents 4 0 R >>", "<< /Length 0 >>\nstream\n\nendstream"}
	var b bytes.Buffer
	b.WriteString("%PDF-1.7\n")
	offsets := []int{0}
	for i, s := range objects {
		offsets = append(offsets, b.Len())
		fmt.Fprintf(&b, "%d 0 obj\n%s\nendobj\n", i+1, s)
	}
	pos := b.Len()
	fmt.Fprintf(&b, "xref\n0 5\n0000000000 65535 f \n")
	for _, offset := range offsets[1:] {
		fmt.Fprintf(&b, "%010d 00000 n \n", offset)
	}
	fmt.Fprintf(&b, "trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n", pos)
	return b.Bytes()
}
func TestPasswordRoundTripAndRejection(t *testing.T) {
	data := fixture()
	before := bytes.Clone(data)
	encrypted, err := cryptPDF("encrypt", data, "test-password")
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(data, before) {
		t.Fatal("source mutated")
	}
	if !bytes.Contains(encrypted, []byte("/Encrypt")) {
		t.Fatal("missing standard encryption")
	}
	if _, err = cryptPDF("decrypt", encrypted, "wrong-password"); err == nil {
		t.Fatal("wrong password accepted")
	}
	plain, err := cryptPDF("decrypt", encrypted, "test-password")
	if err != nil {
		t.Fatal(err)
	}
	if err = api.Validate(context.Background(), bytes.NewReader(plain), model.NewStatelessConfiguration(), nil); err != nil {
		t.Fatal(err)
	}
	for _, input := range []struct {
		op   string
		data []byte
		pw   string
	}{{"encrypt", data, "short"}, {"unknown", data, "long-password"}, {"encrypt", nil, "test-password"}, {"encrypt", []byte(strings.Repeat("x", maxInput+1)), "test-password"}} {
		if _, err = cryptPDF(input.op, input.data, input.pw); err == nil {
			t.Fatal("invalid input accepted")
		}
	}
}
