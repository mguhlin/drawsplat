import {test} from 'node:test';
import assert from 'node:assert/strict';
import {imageCardLayout} from '../src/image-layout.js';
test('whole infographics fit the largest panel area in Reel and Feed without distortion',()=>{
  for(const height of [1920,1350])for(const [iw,ih] of [[1122,1402],[800,3000],[2000,600]]){
    const r=imageCardLayout(1080,height,iw,ih);
    assert.ok(Math.abs(r.width/r.height-iw/ih)<1e-8);
    assert.ok(r.x>=1080*.02-1e-8 && r.y>=height*.02-1e-8);
    assert.ok(r.x+r.width<=1080*.98+1e-8 && r.y+r.height<=height*.98+1e-8);
    assert.ok(Math.abs(r.width-1080*.96)<1e-8||Math.abs(r.height-height*.96)<1e-8);
  }
});
test('captions and border artwork reserve space rather than crop images',()=>{
  const full=imageCardLayout(1080,1920,800,3000);
  const caption=imageCardLayout(1080,1920,800,3000,{title:true,creator:true});
  const frame=imageCardLayout(1080,1920,800,3000,{illustrated:true,framed:true,title:true,creator:true});
  assert.ok(caption.height<full.height);assert.ok(caption.y+caption.height<=1920*.76);
  assert.ok(frame.x>=1080*.26 && frame.y>=1920*.17);
  assert.ok(frame.y+frame.height<=1920*.60);
});
