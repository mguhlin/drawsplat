# WriteSplatTM Native File Format

WriteSplatTM uses `.writesplat.json` as its durable editable file format.

Current version:

```json
{
  "app": "WriteSplatTM",
  "version": 1,
  "createdAt": "2026-06-29T00:00:00.000Z",
  "updatedAt": "2026-06-29T00:00:00.000Z",
  "metadata": {
    "title": "Untitled Document",
    "author": "",
    "targetGrade": "6"
  },
  "document": {
    "format": "prosemirror-json",
    "content": {
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 1 },
          "content": [{ "type": "text", "text": "Untitled Document" }]
        },
        {
          "type": "paragraph",
          "content": [{ "type": "text", "text": "Start writing..." }]
        }
      ]
    }
  },
  "teacher": {
    "studentView": false,
    "citations": [],
    "answerKey": []
  }
}
```

The app still recognizes the first foundation shape during development:

```json
{
  "document": {
    "format": "html",
    "body": "<h1>Untitled Document</h1><p>Start writing...</p>"
  }
}
```

When that older shape is opened or autosaved again, WriteSplatTM migrates the
document into ProseMirror JSON.
