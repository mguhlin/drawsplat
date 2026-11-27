//go:build js && wasm

package main

import (
	"syscall/js"
)

func main() {
	js.Global().Set("pdfSplatCrypt", js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) != 3 {
			return map[string]any{"error": "Invalid PDF security request"}
		}
		length := args[1].Get("byteLength").Int()
		if length < 1 || length > maxInput {
			return map[string]any{"error": "Choose a PDF up to 16 MiB"}
		}
		data := make([]byte, length)
		js.CopyBytesToGo(data, args[1])
		defer clear(data)
		output, err := cryptPDF(args[0].String(), data, args[2].String())
		if err != nil {
			return map[string]any{"error": err.Error()}
		}
		result := js.Global().Get("Uint8Array").New(len(output))
		js.CopyBytesToJS(result, output)
		clear(output)
		return map[string]any{"bytes": result}
	}))
	select {}
}
