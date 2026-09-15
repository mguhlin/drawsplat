import { describe, expect, it } from 'vitest';
import { chromaProperties, chromaSettings, defaultChroma, keyPixels } from './chroma';
describe('green screen', () => {
  it('removes matching green while preserving foreground and existing transparency', () => {
    const pixels = new Uint8ClampedArray([0,255,0,255, 255,0,0,128, 0,255,0,0]);
    keyPixels(pixels, {...defaultChroma, enabled:true});
    expect([...pixels]).toEqual([0,255,0,0, 255,0,0,128, 0,255,0,0]);
  });
  it('softens near matches without increasing alpha; zero softness is a hard key', () => {
    const p = new Uint8ClampedArray([30,225,30,128]);
    keyPixels(p,{...defaultChroma,enabled:true,tolerance:10,softness:40}); expect(p[3]).toBe(64);
    const hard = new Uint8ClampedArray([30,225,30,128]); keyPixels(hard,{...defaultChroma,enabled:true,tolerance:10,softness:0}); expect(hard[3]).toBe(128);
  });
  it('supports blue spill reduction and bypassing the effect', () => {
    const p = new Uint8ClampedArray([40,60,180,255]); keyPixels(p,{...defaultChroma,enabled:true,color:'#0000ff',tolerance:0,softness:0,spill:true}); expect([...p]).toEqual([40,60,60,255]);
    const bypass = new Uint8ClampedArray([0,255,0,255]); keyPixels(bypass,defaultChroma); expect(bypass[3]).toBe(255);
  });
  it('round-trips clip properties and normalizes invalid project inputs', () => {
    const s={...defaultChroma,enabled:true,color:'#0000ff'}; expect(chromaSettings(chromaProperties(s))).toEqual(s);
    expect(chromaSettings({chromaColor:'invalid',chromaTolerance:Infinity,chromaSoftness:-2})).toEqual({...defaultChroma,softness:0});
  });
});
