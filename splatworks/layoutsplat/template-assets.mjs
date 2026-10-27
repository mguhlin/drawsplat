import {PHOTO_ASSET_PATHS} from './photo-placeholders.mjs';
import {BOOK_COVER_PATHS} from './book-catalog.mjs';
import {CHARACTER_ASSET_PATHS} from './character-catalog.mjs';
// Closed local allowlist, shared by the project validator and raster embedding.
export const TEMPLATE_ASSETS = [...PHOTO_ASSET_PATHS, ...CHARACTER_ASSET_PATHS, ...BOOK_COVER_PATHS, 'sample-art.svg', 'splatworks-logo.png', ...Array.from({length: 6}, (_, i) => `comic-art-${i + 1}.svg`)];
