# OpenDocument fixture

`libreoffice-classroom.odt` was saved by LibreOffice 25.2.3.2 from the adjacent
small HTML file, authored for these tests. It contains a heading, styled text,
Spanish accents, a list, and a table; it contains no external resources or macros.
Regenerate using a separate LibreOffice profile:

    libreoffice -env:UserInstallation=file:///tmp/pdfsplat-odt-test-profile --headless --convert-to odt --outdir /tmp/pdfsplat-odt-fixture libreoffice-classroom.html

The browser tests load the committed ODT directly and do not require LibreOffice.
