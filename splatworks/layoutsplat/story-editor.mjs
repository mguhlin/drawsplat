import { createRichEditor } from './rich-editor.mjs';
import { textToRichDocument, richDocumentToText } from './rich.mjs';
import { applyTextStyle } from './layout.mjs';
export function setupStoryEditor() {
  const dialog = document.getElementById('storyDialog'), original = document.getElementById('storyText');
  const host = document.createElement('div'); host.id = 'storyEditor'; original.replaceWith(host);
  const toolbar = document.createElement('div'); toolbar.className = 'story-format-tools'; toolbar.setAttribute('role', 'toolbar'); toolbar.setAttribute('aria-label', 'Story formatting');
  for (const [mark, key, tag, label] of [['strong','bold','strong','B'],['em','italic','em','I'],['underline','underline','u','U']]) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.storyMark = mark; button.dataset.i18nAriaLabel = key; button.setAttribute('aria-label', key); button.setAttribute('aria-pressed','false');
    const icon = document.createElement(tag); icon.textContent = label; button.append(icon); toolbar.append(button);
  }
  for (const align of ['left','center','right','justify']) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.storyAlign = align; button.dataset.i18nAriaLabel = align; button.setAttribute('aria-label', align); button.setAttribute('aria-pressed','false');
    const lines = [0,1,2,3].map((_,i) => { const short=i%2===1 && align!=='justify', x=short && align==='center'?5:short && align==='right'?9:3, w=short?12:18; return `M${x} ${4+i*5}h${w}`; }).join('');
    button.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${lines}"/></svg>`; toolbar.append(button);
  }
  host.before(toolbar);
  let editor, story;
  function update(view) {
    const { from, to, empty, $from } = view.state.selection;
    for (const button of toolbar.querySelectorAll('[data-story-mark]')) {
      const type = view.state.schema.marks[button.dataset.storyMark];
      button.setAttribute('aria-pressed', String(empty ? type.isInSet(view.state.storedMarks || $from.marks()) !== undefined : view.state.doc.rangeHasMark(from,to,type)));
    }
    for (const button of toolbar.querySelectorAll('[data-story-align]')) button.setAttribute('aria-pressed',String(($from.parent.attrs.align || story.style.align) === button.dataset.storyAlign));
  }
  // Mouse presses must keep the selected words selected when a toolbar is used.
  toolbar.addEventListener('mousedown', event => event.preventDefault());
  toolbar.addEventListener('click', event => { const button=event.target.closest('button'); if(button?.dataset.storyMark)editor.toggle(button.dataset.storyMark);if(button?.dataset.storyAlign)editor.align(button.dataset.storyAlign); });
  dialog.addEventListener('close', () => { editor?.destroy(); editor=null; });
  return {
    open(next) {
      editor?.destroy(); host.replaceChildren(); story=next;
      applyTextStyle(host,{...story.style,weight:'normal',italic:false,underline:false});
      editor=createRichEditor(host,textToRichDocument(story),update); editor.view.dom.id='storyText'; editor.view.dom.setAttribute('aria-label','Story text'); update(editor.view);
      dialog.showModal(); editor.view.focus();
    },
    value: () => richDocumentToText(editor.value(),story.style),
  };
}
