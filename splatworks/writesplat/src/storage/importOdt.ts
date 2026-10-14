import { extractZipEntry } from './importDocx';
import { odtXmlToHtml } from '../../../shared/office-text.mjs';
export async function odtToHtml(buffer: ArrayBuffer): Promise<string> {
  if(buffer.byteLength>20_000_000)throw new Error('Document imports are limited to 20 MB.');
  const xml = await extractZipEntry(buffer, 'content.xml');
  if (!xml) throw new Error('This does not look like an OpenDocument .odt file.');
  const styles=await extractZipEntry(buffer,'styles.xml');
  return odtXmlToHtml(xml,styles);
}
