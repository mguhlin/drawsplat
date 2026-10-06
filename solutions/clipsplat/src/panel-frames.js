import paintParty from '../artwork/paint-party.png';
import celestialMagic from '../artwork/celestial-magic.png';
import botanicalGarden from '../artwork/botanical-garden.png';
import scrapbook from '../artwork/scrapbook-memories.png';
import sunset from '../artwork/sunset-waves.png';
import watercolor from '../artwork/watercolor-bloom.png';
import deco from '../artwork/gilded-deco.png';
import celebration from '../artwork/celebration.png';
import starlight from '../artwork/starlight.png';
import artist from '../artwork/artist.png';
import cinema from '../artwork/cinema.png';
import film_vintage from '../artwork/film-vintage.png';
import instant_classic from '../artwork/instant-classic.png';
import instant_scrapbook from '../artwork/instant-scrapbook.png';
const FRAME_ARTWORK = {'paint-party':paintParty, celestial:celestialMagic, botanical:botanicalGarden,scrapbook,sunset,watercolor,deco,'celebration':celebration,'starlight':starlight,'artist':artist,'cinema':cinema,'film-vintage':film_vintage,'instant-classic':instant_classic,'instant-scrapbook':instant_scrapbook};
const frameCache = new Map();
export const isIllustratedFrame = style => Object.hasOwn(FRAME_ARTWORK, style);
export function loadIllustratedFrame(style) {
  if (!isIllustratedFrame(style)) return Promise.resolve();
  if (frameCache.has(style)) return frameCache.get(style).ready;
  const image = new Image();
  image.src = FRAME_ARTWORK[style];
  const ready = image.decode().catch(error => { frameCache.delete(style); throw error; });
  frameCache.set(style,{image,ready});
  return ready;
}
function drawIllustratedFrame(ctx, width, height, style) {
  const image = frameCache.get(style)?.image;
  if (!image?.complete || !image.naturalWidth) return;
  const sw = image.naturalWidth, sh = image.naturalHeight;
  const scale = Math.min(width / sw, height / sh);
  const cw = sw * .25 * scale, ch = sh * .25 * scale;
  const sx=[0,sw*.25,sw*.75,sw], sy=[0,sh*.25,sh*.75,sh];
  const dx=[0,cw,width-cw,width], dy=[0,ch,height-ch,height];
  // Nine-slice keeps corner artwork proportional and adapts the edges for feed cards.
  ctx.save();
  for(let row=0;row<3;row++) for(let col=0;col<3;col++) {
    if(row===1&&col===1)continue;
    ctx.drawImage(image,sx[col],sy[row],sx[col+1]-sx[col],sy[row+1]-sy[row],dx[col],dy[row],dx[col+1]-dx[col],dy[row+1]-dy[row]);
  }
  ctx.restore();
}
export const FRAME_OPTIONS = [
  ['none', 'Plain · no frame'],
  ['paint-party', 'Paint Party · illustrated'],
  ['celestial', 'Celestial Magic · illustrated'],
  ['botanical', 'Botanical Garden · illustrated'],
  ['scrapbook', 'Scrapbook Memories · illustrated'],
  ['sunset', 'Sunset Waves · illustrated'],
  ['watercolor', 'Watercolor Bloom · illustrated'],
  ['deco', 'Gilded Deco · illustrated'],
  ['celebration', 'Celebration Gala · illustrated'],
  ['starlight', 'Starlight Dreams · illustrated'],
  ['artist', 'Artist Studio · illustrated'],
  ['cinema', 'Cinema Classics · illustrated'],
  ['film-vintage', 'Vintage Film · illustrated'],
  ['instant-classic', 'Instant Classic · illustrated'],
  ['instant-scrapbook', 'Instant Scrapbook · illustrated'],
  ['film', 'Movie night']
];

// Deterministic decorations stay outside the title/image area, in every format.
export function drawPanelFrame(ctx, width, height, style, foreground, accent) {
  if (style === 'none' || !FRAME_OPTIONS.some(([key]) => key === style)) return;
  if (isIllustratedFrame(style)) { drawIllustratedFrame(ctx,width,height,style); return; }
  ctx.save();
  const unit = Math.min(width, height);
  if (style === 'film') {
    ctx.fillStyle = '#172033';
    ctx.fillRect(0, 0, width, height * .075);
    ctx.fillRect(0, height * .925, width, height * .075);
    ctx.fillRect(0, 0, width * .065, height);
    ctx.fillRect(width * .935, 0, width * .065, height);
    ctx.fillStyle = '#faf8ff';
    for (let i = 0; i < 12; i++) {
      const x = width * (.09 + i * .074);
      for (const y of [height * .024, height * .947]) {
        ctx.beginPath(); ctx.roundRect(x, y, width * .04, height * .03, unit * .006); ctx.fill();
      }
    }
    for (let i = 0; i < 10; i++) {
      const y = height * (.105 + i * .08);
      for (const x of [width * .017, width * .95]) {
        ctx.beginPath(); ctx.roundRect(x, y, width * .032, height * .045, unit * .006); ctx.fill();
      }
    }
    ctx.strokeStyle = accent; ctx.lineWidth = unit * .004;
    ctx.strokeRect(width * .082, height * .09, width * .836, height * .82);
  }
  ctx.restore();
}

export const VIDEO_FRAME_OPTIONS = FRAME_OPTIONS.filter(([key])=>['none','cinema','film-vintage','instant-classic','instant-scrapbook'].includes(key));
// Largest clear center rectangles measured from each original alpha channel.
// Coordinates follow the same nine-slice transform as the border artwork.
const VIDEO_WINDOWS = {"cinema": [0.17640807651434645, 0.13157894736842105, 0.824654622741764, 0.8564593301435407], "film-vintage": [0.1742826780021254, 0.12858851674641147, 0.8193411264612115, 0.8283492822966507], "instant-classic": [0.11370882040382571, 0.11722488038277512, 0.8873538788522848, 0.8163875598086124], "instant-scrapbook": [0.13602550478214664, 0.1513157894736842, 0.8682252922422954, 0.7918660287081339]};
export function videoFrameViewport(width,height,style) {
  const window = VIDEO_WINDOWS[style];
  if (!window) return {x:0,y:0,width,height};
  const image = frameCache.get(style)?.image, sw=image?.naturalWidth||941, sh=image?.naturalHeight||1672;
  const scale=Math.min(width/sw,height/sh),cw=sw*.25*scale,ch=sh*.25*scale;
  const map=(fraction,length,corner,original)=>fraction<=.25 ? fraction*original*scale : fraction>=.75 ? length-(1-fraction)*original*scale : corner+(fraction-.25)/.5*(length-2*corner);
  const [left,top,right,bottom]=window;
  const even=value=>Math.round(value/2)*2;
  const x=even(map(left,width,cw,sw)),y=even(map(top,height,ch,sh));
  return {x,y,width:even(map(right,width,cw,sw)-x),height:even(map(bottom,height,ch,sh)-y)};
}
