import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap, toggleMark } from 'prosemirror-commands';
import { history, undo, redo } from 'prosemirror-history';
const schema = new Schema({ nodes: { doc: { content: 'paragraph+' }, paragraph: { content: 'inline*', group: 'block', parseDOM: [{ tag: 'p' }], toDOM: () => ['p', 0] }, text: { group: 'inline' }, hard_break: { inline: true, group: 'inline', selectable: false, parseDOM: [{ tag: 'br' }], toDOM: () => ['br'] } }, marks: {
  strong: { parseDOM: [{ tag: 'strong' }, { tag: 'b' }], toDOM: () => ['strong', 0] },
  em: { parseDOM: [{ tag: 'em' }, { tag: 'i' }], toDOM: () => ['em', 0] },
  underline: { parseDOM: [{ tag: 'u' }], toDOM: () => ['u', 0] },
  link: { attrs: { href: {} }, inclusive: false, toDOM: m => ['a', { href: m.attrs.href, rel: 'noopener noreferrer' }, 0] },
  style: { attrs: { color: { default: null }, size: { default: null }, font: { default: null } }, toDOM: m => ['span', { style: [m.attrs.color ? `color:${m.attrs.color}` : '', m.attrs.size ? `font-size:${m.attrs.size}pt` : '', m.attrs.font ? `font-family:${m.attrs.font}` : ''].filter(Boolean).join(';') }, 0] }
} });
export function createRichEditor(host, documentJson) {
  const view = new EditorView(host, { state: EditorState.create({ schema, doc: schema.nodeFromJSON(documentJson), plugins: [history(), keymap({ 'Mod-z': undo, 'Mod-Shift-z': redo, 'Mod-b': toggleMark(schema.marks.strong), 'Mod-i': toggleMark(schema.marks.em), 'Mod-u': toggleMark(schema.marks.underline) }), keymap(baseKeymap)] }), attributes: { role: 'textbox', 'aria-label': 'Rich publication story', 'aria-multiline': 'true' } });
  return { view, value: () => view.state.doc.toJSON(), toggle: name => { toggleMark(schema.marks[name])(view.state, view.dispatch); view.focus(); }, style: attrs => { const { from, to, empty } = view.state.selection; const mark = schema.marks.style.create(attrs); if (empty) view.dispatch(view.state.tr.addStoredMark(mark)); else view.dispatch(view.state.tr.addMark(from, to, mark)); view.focus(); }, link: href => { if (!/^(https?:\/\/|mailto:)[^\s<>"']+$/i.test(href)) throw Error('Use an HTTP(S) or mailto link.'); toggleMark(schema.marks.link, { href })(view.state, view.dispatch); view.focus(); }, destroy: () => view.destroy() };
}
