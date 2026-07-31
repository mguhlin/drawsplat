CipherSplat Offline Edition
===========================

1. Keep this entire CipherSplat folder together.
2. Open index.html in a current Chrome, Edge, Firefox, or Safari browser.
3. The Internet Connection switch starts OFF every time the app opens.

Encryption, decryption, password generation, and file handling are local in
both switch positions. The switch only enables or disables optional links to
DrawSplat.org; CipherSplat contains no upload, analytics, or tracking code.

If a browser blocks Web Crypto for pages opened directly from disk, start a
local static server in the folder instead. For example:

  python3 -m http.server 8080

Then open http://localhost:8080/ in that browser. No internet connection is
needed for a localhost server.

Always test decryption before deleting the original data. CipherSplat cannot
recover a forgotten password.

