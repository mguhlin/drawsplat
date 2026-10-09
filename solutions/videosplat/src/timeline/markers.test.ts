import {describe,it,expect} from 'vitest';
import {createProject,validateProject} from '../domain/project';
import {History} from '../domain/history';
import {projectDuration} from './engine';
import {addMarker,updateMarker,removeMarker,nearbyMarker} from './markers';
describe('timeline bookmarks',()=>{
 it('adds frame-aligned markers without changing clips or export duration',()=>{
  const original=createProject();original.tracks[0].clips.push({id:'clip',name:'Title',kind:'text',start:0,duration:5,sourceStart:0,properties:{text:'Hello'}});
  const marked=addMarker(original,1.234);
  expect(marked.markers?.[0].time).toBeCloseTo(37/30,8);
  expect(marked.tracks).toEqual(original.tracks);expect(projectDuration(marked)).toBe(projectDuration(original));
  expect(original.markers).toBeUndefined();expect(validateProject(JSON.parse(JSON.stringify(marked)))).toEqual(marked);
 });
 it('accepts old version one and two manifests without markers',()=>{
  const original=createProject();expect(validateProject(original).markers).toBeUndefined();
  expect(validateProject({...original,version:1}).version).toBe(2);
 });
 it('updates and deletes markers with undo and redo while retaining timeline data',()=>{
  const history=new History(createProject());const added=addMarker(history.value,2);history.commit(added);
  const marker=added.markers![0];history.commit(updateMarker(history.value,marker.id,{name:' Scene two ',time:3,color:'#3ddc97'}));
  expect(history.value.markers![0].name).toBe('Scene two');
  history.commit(removeMarker(history.value,marker.id));expect(history.value.markers).toEqual([]);
  expect(history.undo().markers![0].name).toBe('Scene two');expect(history.redo().markers).toEqual([]);
 });
 it('navigates chronological neighbors without mutating their stored order',()=>{
  const markers=[{id:'a',name:'Late',time:4,color:'#f5b942'},{id:'b',name:'Early',time:1,color:'#f5b942'}];
  expect(nearbyMarker(markers,2,-1)?.id).toBe('b');expect(nearbyMarker(markers,1,1)?.id).toBe('a');
  expect(nearbyMarker(markers,0,-1)).toBeUndefined();expect(nearbyMarker(markers,4,1)).toBeUndefined();expect(markers[0].id).toBe('a');
 });
 it.each([null,{},[{id:'a',name:'Bad',time:-1,color:'#f5b942'}],[{id:'a',name:'Bad',time:1,color:'red'}]])('rejects malformed optional marker data: %j',markers=>{
  expect(()=>validateProject({...createProject(),markers})).toThrow('incomplete');
 });
 it('rejects duplicate marker identifiers and nonfinite times',()=>{
  const p=addMarker(createProject(),2);expect(()=>validateProject({...p,markers:[...p.markers!,...p.markers!]})).toThrow();
  expect(addMarker(p,Infinity)).toBe(p);expect(updateMarker(p,p.markers![0].id,{name:'',time:2,color:'#f5b942'})).toBe(p);
 });
});
