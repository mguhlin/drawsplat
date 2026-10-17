# American English hyphenation

`hyph_en_US.dic`, version 2010-02-23, is the LibreOffice/OpenOffice American English pattern dictionary. The complete original notices and permissions are in LICENSE.txt. Upstream: https://github.com/LibreOffice/dictionaries/blob/master/en/hyph_en_US.dic .

SHA-256 of the included dictionary: `546b4c007d82b3bc9b3a691a3048eaae86741a162cd4e64a41fdebe147e5e473`.

`patterns-en-us.mjs` embeds the dictionary as a JSON string. Rebuild from the repository root:

```bash
node --input-type=module -e 'import fs from "node:fs"; const p="splatworks/layoutsplat/hyphenation/"; fs.writeFileSync(p+"patterns-en-us.mjs", "export default "+JSON.stringify(fs.readFileSync(p+"hyph_en_US.dic", "utf8"))+";\n");'
```

The application trie uses ASCII English patterns with left/right minima 2/3; non-ASCII words and other publication languages fall back to browser/manual behavior. No network dictionary is fetched.
