import {CHARACTER_ASSET_PATHS} from './character-catalog.mjs';
// Closed local allowlist, shared by the project validator and raster embedding.
export const TEMPLATE_ASSETS = [...CHARACTER_ASSET_PATHS, 'sample-art.svg', 'splatworks-logo.png', ...Array.from({length: 6}, (_, i) => `comic-art-${i + 1}.svg`)];
