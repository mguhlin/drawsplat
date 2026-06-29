export function createStandaloneHtml(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { max-width: 760px; margin: 48px auto; padding: 0 24px; font-family: ui-serif, Georgia, serif; line-height: 1.65; color: #1f2937; }
    h1, h2, h3, h4, h5, h6 { line-height: 1.2; font-family: ui-sans-serif, system-ui, sans-serif; }
    a { color: #6d28d9; }
    .page-break { break-after: page; page-break-after: always; height: 0; margin: 0; border: 0; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const escapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return escapes[char] ?? char;
  });
}
