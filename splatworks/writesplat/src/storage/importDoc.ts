import { decodeLegacyWord } from '../../../shared/word-legacy/import.mjs';
import { legacyWordXmlToHtml } from '../../../shared/office-text.mjs';
export async function docToHtml(file: File): Promise<string> {
  return legacyWordXmlToHtml(await decodeLegacyWord(file));
}
