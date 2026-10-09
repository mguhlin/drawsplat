import { useState } from 'react';
import type { TimelineMarker } from '../domain/project';
import { MARKER_COLORS } from '../timeline/markers';
function MarkerEditor({marker,onSave}: {marker:TimelineMarker;onSave:(patch:Pick<TimelineMarker,'name'|'time'|'color'>)=>void}) {
 const [name,setName]=useState(marker.name),[time,setTime]=useState(marker.time),[color,setColor]=useState(marker.color);
 return <form className="marker-editor" onSubmit={event=>{event.preventDefault();onSave({name,time,color})}}>
  <label>Name<input aria-label="Marker name" value={name} maxLength={120} required onChange={event=>setName(event.target.value)}/></label>
  <label>Time (seconds)<input aria-label="Marker time" type="number" min="0" step="any" required value={time} onChange={event=>setTime(Number(event.target.value))}/></label>
  <label>Color<select aria-label="Marker color" value={color} onChange={event=>setColor(event.target.value)}>
   {!MARKER_COLORS.includes(color)&&<option value={color}>Custom</option>}
   {MARKER_COLORS.map((value,index)=><option key={value} value={value}>{['Gold','Purple','Green','Rose','Blue'][index]}</option>)}
  </select></label><button className="primary" type="submit" disabled={!name.trim()||!Number.isFinite(time)||time<0}>Save marker</button>
 </form>;
}
export function MarkerPanel({markers,duration,onSave,onDelete,onSeek}: {markers:TimelineMarker[];duration:number;
 onSave:(id:string,patch:Pick<TimelineMarker,'name'|'time'|'color'>)=>void;onDelete:(id:string)=>void;onSeek:(time:number)=>void}) {
 const [selected,setSelected]=useState(markers[0]?.id);
 const marker=markers.find(item=>item.id===selected);
 return <><h2 id="dialog-title">Timeline markers</h2>
  <p className="hint">Bookmarks stay at their saved timeline times when clips move. They appear in project files, never in rendered video. Press M to add one at the playhead.</p>
  {markers.length?<ul className="marker-list">{[...markers].sort((a,b)=>a.time-b.time).map(item=><li key={item.id}>
   <button className={selected===item.id?'active':''} onClick={()=>setSelected(item.id)}><i style={{background:item.color}}/>{item.name}<small>{item.time.toFixed(3)} s{item.time>duration?' · Beyond current video':''}</small></button>
   <button disabled={item.time>duration} aria-label={`Go to marker ${item.name}`} onClick={()=>onSeek(item.time)}>Go to</button>
   <button className="danger" aria-label={`Delete marker ${item.name}`} onClick={()=>onDelete(item.id)}>Delete</button>
  </li>)}</ul>:<p>No markers yet. Close this panel and choose Add marker at a useful point in the timeline.</p>}
  {marker&&<MarkerEditor key={`${marker.id}:${marker.name}:${marker.time}:${marker.color}`} marker={marker} onSave={patch=>onSave(marker.id,patch)}/>}</>;
}
