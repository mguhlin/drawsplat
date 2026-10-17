import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap, toggleMark } from 'prosemirror-commands';
import { history, undo, redo } from 'prosemirror-history';
const schema = new Schema({ nodes: { doc: { content: 'paragraph+' }, paragraph: { content: 'inline*', group: 'block', attrs: Object.fromEntries(['leading','align','lineMultiple','spaceBefore','spaceAfter','indentLeft','indentRight','firstLineIndent','tabs','list'].map(key => [key,{default:null}])), parseDOM: [{ tag: 'p' }], toDOM: node => { const p=node.attrs; return ['p',{style:[p.align?`text-align:${p.align}`:'',p.lineMultiple?`line-height:${p.lineMultiple}`:p.leading?`line-height:${p.leading}pt`:'',`padding:${p.spaceBefore||0}pt ${p.indentRight||0}pt ${p.spaceAfter||0}pt ${p.indentLeft||0}pt`,`text-indent:${p.firstLineIndent||0}pt`].filter(Boolean).join(';')},0]; } }, text: { group: 'inline' }, hard_break: { inline: true, group: 'inline', selectable: false, parseDOM: [{ tag: 'br' }], toDOM: () => ['br'] } }, marks: {
  strong: { parseDOM: [{ tag: 'strong' }, { tag: 'b' }], toDOM: () => ['strong', 0] },
  em: { parseDOM: [{ tag: 'em' }, { tag: 'i' }], toDOM: () => ['em', 0] },
  underline: { parseDOM: [{ tag: 'u' }], toDOM: () => ['u', 0] },
  link: { attrs: { href: {} }, inclusive: false, toDOM: m => ['a', { href: m.attrs.href, rel: 'noopener noreferrer' }, 0] },
  style: { attrs: { color: { default: null }, size: { default: null }, font: { default: null }, tracking: { default: null } }, toDOM: m => ['span', { style: [m.attrs.color ? `color:${m.attrs.color}` : '', m.attrs.size ? `font-size:${m.attrs.size}pt` : '', m.attrs.font ? `font-family:${m.attrs.font}` : '', m.attrs.tracking !== null ? `letter-spacing:${m.attrs.tracking}pt` : ''].filter(Boolean).join(';') }, 0] }
} });
export function createRichEditor(host, documentJson, onChange = () => {}) {
  const view = new EditorView(host, { state: EditorState.create({ schema, doc: schema.nodeFromJSON(documentJson), plugins: [history(), keymap({ 'Mod-z': undo, 'Mod-Shift-z': redo, 'Mod-b': toggleMark(schema.marks.strong), 'Mod-i': toggleMark(schema.marks.em), 'Mod-u': toggleMark(schema.marks.underline) }), keymap(baseKeymap)] }), dispatchTransaction: tr => { view.updateState(view.state.apply(tr)); onChange(view); }, attributes: { role: 'textbox', 'aria-label': 'Rich publication story', 'aria-multiline': 'true' } });
  return { view, value: () => view.state.doc.toJSON(), toggle: name => { toggleMark(schema.marks[name])(view.state, view.dispatch); view.focus(); }, style: attrs => { const { from, to, empty } = view.state.selection; const tr=view.state.tr;
    if(empty){const prior=(view.state.storedMarks||view.state.selection.$from.marks()).find(mark=>mark.type===schema.marks.style);tr.addStoredMark(schema.marks.style.create({...prior?.attrs,...attrs}));}
    else view.state.doc.nodesBetween(from,to,(node,pos)=>{if(node.isText){const prior=node.marks.find(mark=>mark.type===schema.marks.style);tr.addMark(Math.max(from,pos),Math.min(to,pos+node.nodeSize),schema.marks.style.create({...prior?.attrs,...attrs}));}});
    view.dispatch(tr); view.focus(); }, align: align => { if(!['left','center','right','justify'].includes(align))return;const{from,to}=view.state.selection,tr=view.state.tr;view.state.doc.nodesBetween(from,to,(node,pos)=>{if(node.type===schema.nodes.paragraph)tr.setNodeMarkup(pos,null,{...node.attrs,align});});view.dispatch(tr);view.focus(); }, link: href => { if (!/^(https?:\/\/|mailto:)[^\s<>"']+$/i.test(href)) throw Error('Use an HTTP(S) or mailto link.'); toggleMark(schema.marks.link, { href })(view.state, view.dispatch); view.focus(); }, destroy: () => view.destroy() };
}
