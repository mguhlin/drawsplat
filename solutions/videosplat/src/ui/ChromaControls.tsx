import type { ChromaSettings } from '../render/chroma';
export function ChromaControls({ value, onChange }: { value: ChromaSettings; onChange(value: ChromaSettings): void }) {
  return <fieldset className="chroma-controls"><legend>Green screen</legend>
    <label><input type="checkbox" checked={value.enabled} onChange={e => onChange({ ...value, enabled: e.target.checked })}/>Remove green / blue screen</label>
    {value.enabled && <>
      <label>Screen color<input aria-label="Screen color" type="color" value={value.color} onChange={e => onChange({ ...value, color: e.target.value })}/></label>
      <div className="chroma-presets"><button type="button" onClick={() => onChange({ ...value, color: '#00ff00' })}>Green</button><button type="button" onClick={() => onChange({ ...value, color: '#0000ff' })}>Blue</button></div>
      <label>Tolerance · {value.tolerance}<input aria-label="Green screen tolerance" type="range" min="0" max="255" value={value.tolerance} onChange={e => onChange({ ...value, tolerance: +e.target.value })}/></label>
      <label>Edge smoothing · {value.softness}<input aria-label="Green screen edge smoothing" type="range" min="0" max="100" value={value.softness} onChange={e => onChange({ ...value, softness: +e.target.value })}/></label>
      <label><input type="checkbox" checked={value.spill} onChange={e => onChange({ ...value, spill: e.target.checked })}/>Reduce green / blue spill</label>
      <small>Adjust the color and tolerance for your backdrop. Matching clothing can also disappear; spill reduction can change matching colors.</small>
    </>}
  </fieldset>;
}
