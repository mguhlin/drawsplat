# PDFSplat: draw clickable link areas

1. Open a PDF, or import an image as a PDF page.
2. Under **Edit & annotate**, choose **Add link**.
3. Drag a box over text, a picture, or any area of the page.
4. Choose **Website or file URL** and paste a complete `http://`, `https://`, or
   `file://` URL, or choose **Page in this PDF** and select the destination page.
5. Optionally give the link a description, then choose **Add link**.
6. Choose **Save as → PDF**. The exported PDF contains clickable link annotations;
   the editor's blue boxes and resize handles are invisible in the downloaded file.

Select a link box to **Edit link**, **Go to link**, or **Delete link**. Drag the
box to move it, use its corner handle to resize it, and use Undo/Redo to revise
changes. Double-click a box to edit its destination. For keyboard insertion,
choose Add link, press Enter, and set the destination; select the saved box and
use arrow keys to position it. Escape cancels an unfinished box or dialog.

Internal links track page identity when pages are reordered. A duplicated page's
self-link points to its duplicate. Deleting a destination page blocks PDF export
until its links are edited or deleted, or the page deletion is undone. Extracting
only some pages omits internal links whose destinations are outside the extracted
PDF. Reopening a saved PDF restores supported website, file, and internal links
as editable boxes, including named destinations resolved by the PDF reader.

Web-hosted files (including shared Drive files) use their HTTPS sharing URL.
`file://` links refer to files on the reader's device or network; the file must
exist there, and the PDF viewer may restrict opening it. Local files are not
uploaded or embedded. Test the downloaded PDF in the reader your audience uses.
Image exports and sanitized, flattened copies do not retain clickable links.
