import { baseKeymap, setBlockType, toggleMark } from 'prosemirror-commands';
import { createAnalysisPlugin, setAnalysisTargetGrade, toggleAnalysisDecorations } from './analysisPlugin';
import { createBlockDragPlugin } from './blockDragPlugin';
import { clearReadAloudRange, createReadAloudPlugin, setReadAloudRange, textRangeFromOffset } from './readAloudPlugin';
import { createVocabularyPlugin, setVocabularyTerms } from './vocabularyPlugin';
import { history, redo, undo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { DOMParser, DOMSerializer, type MarkSpec, type NodeSpec, Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes, liftListItem, sinkListItem, splitListItem, wrapInList } from 'prosemirror-schema-list';
import { wrapIn } from 'prosemirror-commands';
import { EditorState, type Transaction } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import {
  addColumnAfter,
  addRowAfter,
  deleteColumn,
  deleteRow,
  deleteTable,
  mergeCells,
  splitCell,
  tableEditing,
  tableNodes,
} from 'prosemirror-tables';

const paragraphNode: NodeSpec = {
  attrs: {
    align: { default: null },
  },
  content: 'inline*',
  group: 'block',
  parseDOM: [
    {
      tag: 'p',
      getAttrs: (node) => ({ align: domTextAlign(node) }),
    },
  ],
  toDOM(node) {
    return ['p', textAlignAttrs(node.attrs.align), 0];
  },
};
const headingNode: NodeSpec = {
  attrs: {
    level: { default: 1 },
    align: { default: null },
  },
  content: 'inline*',
  group: 'block',
  defining: true,
  parseDOM: [1, 2, 3, 4, 5, 6].map((level) => ({
    tag: `h${level}`,
    getAttrs: (node) => ({ level, align: domTextAlign(node) }),
  })),
  toDOM(node) {
    return [`h${node.attrs.level}`, textAlignAttrs(node.attrs.align), 0];
  },
};
const baseNodes = basicSchema.spec.nodes.update('paragraph', paragraphNode).update('heading', headingNode);
const listNodes = addListNodes(baseNodes, 'paragraph block*', 'block');

function domTextAlign(node: Node | string): string | null {
  if (!(node instanceof HTMLElement)) {
    return null;
  }

  return validTextAlign(node.style.textAlign);
}

function textAlignAttrs(align: unknown): Record<string, string> {
  const value = validTextAlign(align);
  return value ? { style: `text-align: ${value}` } : {};
}

function validTextAlign(value: unknown): string | null {
  return typeof value === 'string' && ['center', 'justify', 'left', 'right'].includes(value) ? value : null;
}

const pageBreakNode: NodeSpec = {
  group: 'block',
  atom: true,
  selectable: true,
  parseDOM: [{ tag: 'div[data-page-break]' }],
  toDOM() {
    return ['div', { class: 'page-break', 'data-page-break': 'true', 'aria-label': 'Page break' }];
  },
};
const teacherOnlyBlockNode: NodeSpec = {
  group: 'block',
  content: 'block+',
  defining: true,
  parseDOM: [{ tag: 'div[data-teacher-only]' }],
  toDOM() {
    return ['div', { class: 'teacher-only teacher-only-block', 'data-teacher-only': 'true' }, 0];
  },
};
const nodes = listNodes
  .append(
    tableNodes({
      tableGroup: 'block',
      cellContent: 'paragraph block*',
      cellAttributes: {},
    }),
  )
  .append({
    page_break: pageBreakNode,
    teacher_only_block: teacherOnlyBlockNode,
  });
const underlineMark: MarkSpec = {
  parseDOM: [
    { tag: 'u' },
    {
      style: 'text-decoration-line',
      getAttrs: (value) => (typeof value === 'string' && value.includes('underline') ? null : false),
    },
    {
      style: 'text-decoration',
      getAttrs: (value) => (typeof value === 'string' && value.includes('underline') ? null : false),
    },
  ],
  toDOM() {
    return ['u', 0];
  },
};
const strikeMark: MarkSpec = {
  parseDOM: [
    { tag: 's' },
    { tag: 'strike' },
    { tag: 'del' },
    {
      style: 'text-decoration-line',
      getAttrs: (value) => (typeof value === 'string' && value.includes('line-through') ? null : false),
    },
    {
      style: 'text-decoration',
      getAttrs: (value) => (typeof value === 'string' && value.includes('line-through') ? null : false),
    },
  ],
  toDOM() {
    return ['s', 0];
  },
};
const clozeMark: MarkSpec = {
  attrs: {
    answer: { default: '' },
  },
  parseDOM: [
    {
      tag: 'span[data-cloze-answer]',
      getAttrs: (node) => ({
        answer: node instanceof HTMLElement ? node.dataset.clozeAnswer ?? node.textContent ?? '' : '',
      }),
    },
  ],
  toDOM(mark) {
    return ['span', { class: 'cloze-answer', 'data-cloze-answer': mark.attrs.answer }, 0];
  },
};
const teacherOnlyMark: MarkSpec = {
  parseDOM: [{ tag: 'span[data-teacher-only]' }],
  toDOM() {
    return ['span', { class: 'teacher-only', 'data-teacher-only': 'true' }, 0];
  },
};
const fontFamilyMark: MarkSpec = {
  attrs: {
    family: { default: '' },
  },
  parseDOM: [
    {
      style: 'font-family',
      getAttrs: (value) => ({ family: typeof value === 'string' ? value : '' }),
    },
  ],
  toDOM(mark) {
    return ['span', { style: `font-family: ${mark.attrs.family}` }, 0];
  },
};
const fontSizeMark: MarkSpec = {
  attrs: {
    size: { default: '' },
  },
  parseDOM: [
    {
      style: 'font-size',
      getAttrs: (value) => ({ size: typeof value === 'string' ? value : '' }),
    },
  ],
  toDOM(mark) {
    return ['span', { style: `font-size: ${mark.attrs.size}` }, 0];
  },
};
const textColorMark: MarkSpec = {
  attrs: {
    color: { default: '' },
  },
  parseDOM: [
    {
      style: 'color',
      getAttrs: (value) => ({ color: typeof value === 'string' ? value : '' }),
    },
  ],
  toDOM(mark) {
    return ['span', { style: `color: ${mark.attrs.color}` }, 0];
  },
};
const highlightMark: MarkSpec = {
  attrs: {
    color: { default: '' },
  },
  parseDOM: [
    {
      style: 'background-color',
      getAttrs: (value) => ({ color: typeof value === 'string' ? value : '' }),
    },
  ],
  toDOM(mark) {
    return ['span', { style: `background-color: ${mark.attrs.color}` }, 0];
  },
};
const marks = basicSchema.spec.marks
  .addToEnd('underline', underlineMark)
  .addToEnd('strike', strikeMark)
  .addToEnd('cloze', clozeMark)
  .addToEnd('teacherOnly', teacherOnlyMark)
  .addToEnd('fontFamily', fontFamilyMark)
  .addToEnd('fontSize', fontSizeMark)
  .addToEnd('textColor', textColorMark)
  .addToEnd('highlight', highlightMark);

export const writeSplatSchema = new Schema({
  nodes,
  marks,
});

export type EditorCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'heading5'
  | 'heading6'
  | 'paragraph'
  | 'blockquote'
  | 'codeBlock'
  | 'bulletList'
  | 'orderedList'
  | 'insertTable'
  | 'insertHorizontalRule'
  | 'insertPageBreak'
  | 'addTableRow'
  | 'addTableColumn'
  | 'deleteTableRow'
  | 'deleteTableColumn'
  | 'mergeTableCells'
  | 'splitTableCell'
  | 'deleteTable'
  | 'undo'
  | 'redo'
  | 'toggleAnalysis';

export interface WriterEditor {
  view: EditorView;
  run(command: EditorCommand): boolean;
  setLink(href: string): boolean;
  removeLink(): boolean;
  findText(query: string): boolean;
  replaceSelection(text: string): boolean;
  replaceAll(query: string, replacement: string): number;
  getSelectionText(): string;
  insertImage(src: string, alt: string): boolean;
  insertText(text: string): boolean;
  markCloze(): boolean;
  removeCloze(): boolean;
  markTeacherOnly(): boolean;
  removeTeacherOnly(): boolean;
  setAnalysisTargetGrade(targetGrade: number): void;
  setFontFamily(fontFamily: string): boolean;
  setFontSize(fontSize: string): boolean;
  setHighlightColor(color: string): boolean;
  setTextAlignment(alignment: string): boolean;
  setTextColor(color: string): boolean;
  setReadAloudTextOffset(offset: number, length: number): void;
  clearReadAloudHighlight(): void;
  setVocabularyTerms(terms: string[]): void;
  getHtml(): string;
  getJson(): unknown;
  setHtml(html: string): void;
  setJson(json: unknown): void;
}

export function createWriterEditor(
  mount: HTMLElement,
  initialHtml: string,
  onChange: () => void,
): WriterEditor {
  const view = new EditorView(mount, {
    state: createState(initialHtml),
    dispatchTransaction(transaction: Transaction) {
      const nextState = view.state.apply(transaction);
      view.updateState(nextState);

      if (transaction.docChanged) {
        onChange();
      }
    },
  });

  return {
    view,
    run(command: EditorCommand) {
      const handled = runCommand(command, view);
      view.focus();
      return handled;
    },
    setLink(href: string) {
      return setLinkMark(view, href);
    },
    removeLink() {
      return removeLinkMark(view);
    },
    findText(query: string) {
      return findTextInDoc(view, query);
    },
    replaceSelection(text: string) {
      return replaceSelectionText(view, text);
    },
    replaceAll(query: string, replacement: string) {
      return replaceAllText(view, query, replacement);
    },
    getSelectionText() {
      const { from, to } = view.state.selection;
      return view.state.doc.textBetween(from, to, '\n\n', '\n');
    },
    insertImage(src: string, alt: string) {
      return insertImageNode(view, src, alt);
    },
    insertText(text: string) {
      view.dispatch(view.state.tr.insertText(text).scrollIntoView());
      view.focus();
      return true;
    },
    markCloze() {
      return markSelectionAsCloze(view);
    },
    removeCloze() {
      return removeClozeMark(view);
    },
    markTeacherOnly() {
      return markSelectionTeacherOnly(view);
    },
    removeTeacherOnly() {
      return removeTeacherOnlyMark(view);
    },
    setAnalysisTargetGrade(targetGrade: number) {
      view.dispatch(setAnalysisTargetGrade(view.state.tr, targetGrade));
    },
    setFontFamily(fontFamily: string) {
      return setTextStyleMark(view, 'fontFamily', { family: fontFamily });
    },
    setFontSize(fontSize: string) {
      return setTextStyleMark(view, 'fontSize', { size: fontSize });
    },
    setHighlightColor(color: string) {
      return setTextStyleMark(view, 'highlight', { color });
    },
    setTextAlignment(alignment: string) {
      return setBlockAlignment(view, alignment);
    },
    setTextColor(color: string) {
      return setTextStyleMark(view, 'textColor', { color });
    },
    setReadAloudTextOffset(offset: number, length: number) {
      const range = textRangeFromOffset(view.state.doc, offset, length);

      if (!range) {
        view.dispatch(clearReadAloudRange(view.state.tr));
        return;
      }

      view.dispatch(setReadAloudRange(view.state.tr, range.from, range.to));
    },
    clearReadAloudHighlight() {
      view.dispatch(clearReadAloudRange(view.state.tr));
    },
    setVocabularyTerms(terms: string[]) {
      view.dispatch(setVocabularyTerms(view.state.tr, terms));
    },
    getHtml() {
      return serializeDoc(view);
    },
    getJson() {
      return view.state.doc.toJSON();
    },
    setHtml(html: string) {
      view.updateState(createState(html));
      onChange();
    },
    setJson(json: unknown) {
      view.updateState(createStateFromDoc(ProseMirrorNode.fromJSON(writeSplatSchema, json)));
      onChange();
    },
  };
}

function markSelectionTeacherOnly(view: EditorView): boolean {
  const { from, to, empty } = view.state.selection;

  if (empty) {
    view.focus();
    return false;
  }

  view.dispatch(view.state.tr.addMark(from, to, writeSplatSchema.marks.teacherOnly.create()));
  view.focus();
  return true;
}

function removeTeacherOnlyMark(view: EditorView): boolean {
  const { from, to, empty } = view.state.selection;

  if (empty) {
    view.focus();
    return false;
  }

  view.dispatch(view.state.tr.removeMark(from, to, writeSplatSchema.marks.teacherOnly));
  view.focus();
  return true;
}

function setTextStyleMark(
  view: EditorView,
  markName: 'fontFamily' | 'fontSize' | 'highlight' | 'textColor',
  attrs: Record<string, string>,
): boolean {
  const markType = writeSplatSchema.marks[markName];
  const value = Object.values(attrs)[0]?.trim() ?? '';
  const { from, to, empty } = view.state.selection;
  let tr = view.state.tr;

  if (!markType) {
    return false;
  }

  if (empty) {
    tr = value ? tr.addStoredMark(markType.create(attrs)) : tr.removeStoredMark(markType);
  } else {
    tr = tr.removeMark(from, to, markType);
    if (value) {
      tr = tr.addMark(from, to, markType.create(attrs));
    }
  }

  view.dispatch(tr.scrollIntoView());
  view.focus();
  return true;
}

function setBlockAlignment(view: EditorView, alignment: string): boolean {
  const align = validTextAlign(alignment);
  const { from, to } = view.state.selection;
  let tr = view.state.tr;
  let changed = false;

  view.state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type === writeSplatSchema.nodes.paragraph || node.type === writeSplatSchema.nodes.heading) {
      tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, align });
      changed = true;
      return false;
    }

    return true;
  });

  if (!changed) {
    view.focus();
    return false;
  }

  view.dispatch(tr.scrollIntoView());
  view.focus();
  return true;
}

function markSelectionAsCloze(view: EditorView): boolean {
  const { from, to, empty } = view.state.selection;

  if (empty) {
    view.focus();
    return false;
  }

  const answer = view.state.doc.textBetween(from, to, ' ', ' ').trim();
  view.dispatch(view.state.tr.addMark(from, to, writeSplatSchema.marks.cloze.create({ answer })));
  view.focus();
  return true;
}

function removeClozeMark(view: EditorView): boolean {
  const { from, to, empty } = view.state.selection;

  if (empty) {
    view.focus();
    return false;
  }

  view.dispatch(view.state.tr.removeMark(from, to, writeSplatSchema.marks.cloze));
  view.focus();
  return true;
}

function insertImageNode(view: EditorView, src: string, alt: string): boolean {
  if (!src) {
    view.focus();
    return false;
  }

  const image = writeSplatSchema.nodes.image.create({
    src,
    alt: alt.trim(),
    title: null,
  });
  view.dispatch(view.state.tr.replaceSelectionWith(image).scrollIntoView());
  view.focus();
  return true;
}

function findTextInDoc(view: EditorView, query: string): boolean {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    view.focus();
    return false;
  }

  const text = view.state.doc.textBetween(0, view.state.doc.content.size, '\n', '\n');
  const selectionStart = view.state.selection.to;
  const beforeSelection = view.state.doc.textBetween(0, selectionStart, '\n', '\n').length;
  let index = text.toLowerCase().indexOf(needle, beforeSelection);

  if (index < 0) {
    index = text.toLowerCase().indexOf(needle);
  }

  if (index < 0) {
    view.focus();
    return false;
  }

  const from = positionFromTextOffset(view.state.doc, index);
  const to = positionFromTextOffset(view.state.doc, index + needle.length);
  view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)).scrollIntoView());
  view.focus();
  return true;
}

function replaceSelectionText(view: EditorView, text: string): boolean {
  const { from, to, empty } = view.state.selection;

  if (empty) {
    view.focus();
    return false;
  }

  view.dispatch(view.state.tr.insertText(text, from, to));
  view.focus();
  return true;
}

function replaceAllText(view: EditorView, query: string, replacement: string): number {
  const needle = query.trim();

  if (!needle) {
    view.focus();
    return 0;
  }

  const matches: Array<{ from: number; to: number }> = [];
  const lowerNeedle = needle.toLowerCase();
  const text = view.state.doc.textBetween(0, view.state.doc.content.size, '\n', '\n');
  let index = text.toLowerCase().indexOf(lowerNeedle);

  while (index >= 0) {
    matches.push({
      from: positionFromTextOffset(view.state.doc, index),
      to: positionFromTextOffset(view.state.doc, index + needle.length),
    });
    index = text.toLowerCase().indexOf(lowerNeedle, index + needle.length);
  }

  if (matches.length === 0) {
    view.focus();
    return 0;
  }

  let tr = view.state.tr;
  [...matches].reverse().forEach((match) => {
    tr = tr.insertText(replacement, match.from, match.to);
  });
  view.dispatch(tr);
  view.focus();
  return matches.length;
}

function positionFromTextOffset(doc: ProseMirrorNode, offset: number): number {
  let seen = 0;
  let found = 1;

  doc.descendants((node, pos) => {
    if (!node.isText) {
      return true;
    }

    const textLength = node.text?.length ?? 0;

    if (seen + textLength >= offset) {
      found = pos + Math.max(0, offset - seen);
      return false;
    }

    seen += textLength;
    return true;
  });

  return found;
}

function setLinkMark(view: EditorView, href: string): boolean {
  const { from, to, empty } = view.state.selection;
  const normalizedHref = normalizeHref(href);

  if (!normalizedHref || empty) {
    view.focus();
    return false;
  }

  view.dispatch(
    view.state.tr.addMark(
      from,
      to,
      writeSplatSchema.marks.link.create({
        href: normalizedHref,
        title: null,
      }),
    ),
  );
  view.focus();
  return true;
}

function removeLinkMark(view: EditorView): boolean {
  const { from, to, empty } = view.state.selection;

  if (empty) {
    view.focus();
    return false;
  }

  view.dispatch(view.state.tr.removeMark(from, to, writeSplatSchema.marks.link));
  view.focus();
  return true;
}

function normalizeHref(href: string): string {
  const trimmed = href.trim();

  if (!trimmed) {
    return '';
  }

  if (/^(https?:|mailto:|tel:)/iu.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function createState(html: string): EditorState {
  return createStateFromDoc(parseHtml(html));
}

function createStateFromDoc(doc: ProseMirrorNode): EditorState {
  return EditorState.create({
    doc,
    plugins: [
      history(),
      createAnalysisPlugin(6),
      createBlockDragPlugin(),
      createReadAloudPlugin(),
      createVocabularyPlugin(),
      tableEditing(),
      keymap({
        'Mod-z': undo,
        'Mod-y': redo,
        'Shift-Mod-z': redo,
        'Mod-b': toggleMark(writeSplatSchema.marks.strong),
        'Mod-i': toggleMark(writeSplatSchema.marks.em),
        Enter: splitListItem(writeSplatSchema.nodes.list_item),
        Tab: sinkListItem(writeSplatSchema.nodes.list_item),
        'Shift-Tab': liftListItem(writeSplatSchema.nodes.list_item),
      }),
      keymap(baseKeymap),
    ],
    schema: writeSplatSchema,
  });
}

function parseHtml(html: string) {
  const host = document.createElement('div');
  host.innerHTML = html;
  return DOMParser.fromSchema(writeSplatSchema).parse(host);
}

function serializeDoc(view: EditorView): string {
  const fragment = DOMSerializer.fromSchema(writeSplatSchema).serializeFragment(view.state.doc.content);
  const host = document.createElement('div');
  host.appendChild(fragment);
  return host.innerHTML;
}

function runCommand(command: EditorCommand, view: EditorView): boolean {
  const dispatch = view.dispatch.bind(view);
  const state = view.state;

  if (command === 'bold') {
    return toggleMark(writeSplatSchema.marks.strong)(state, dispatch, view);
  }

  if (command === 'italic') {
    return toggleMark(writeSplatSchema.marks.em)(state, dispatch, view);
  }

  if (command === 'underline') {
    return toggleMark(writeSplatSchema.marks.underline)(state, dispatch, view);
  }

  if (command === 'strike') {
    return toggleMark(writeSplatSchema.marks.strike)(state, dispatch, view);
  }

  if (command === 'heading1') {
    return setBlockType(writeSplatSchema.nodes.heading, { level: 1 })(state, dispatch, view);
  }

  if (command === 'heading2') {
    return setBlockType(writeSplatSchema.nodes.heading, { level: 2 })(state, dispatch, view);
  }

  if (command === 'heading3') {
    return setBlockType(writeSplatSchema.nodes.heading, { level: 3 })(state, dispatch, view);
  }

  if (command === 'heading4') {
    return setBlockType(writeSplatSchema.nodes.heading, { level: 4 })(state, dispatch, view);
  }

  if (command === 'heading5') {
    return setBlockType(writeSplatSchema.nodes.heading, { level: 5 })(state, dispatch, view);
  }

  if (command === 'heading6') {
    return setBlockType(writeSplatSchema.nodes.heading, { level: 6 })(state, dispatch, view);
  }

  if (command === 'paragraph') {
    return setBlockType(writeSplatSchema.nodes.paragraph)(state, dispatch, view);
  }

  if (command === 'blockquote') {
    return wrapIn(writeSplatSchema.nodes.blockquote)(state, dispatch, view);
  }

  if (command === 'codeBlock') {
    return setBlockType(writeSplatSchema.nodes.code_block)(state, dispatch, view);
  }

  if (command === 'bulletList') {
    return wrapInList(writeSplatSchema.nodes.bullet_list)(state, dispatch, view);
  }

  if (command === 'orderedList') {
    return wrapInList(writeSplatSchema.nodes.ordered_list)(state, dispatch, view);
  }

  if (command === 'insertTable') {
    return insertBasicTable(view);
  }

  if (command === 'insertHorizontalRule') {
    return insertHorizontalRule(view);
  }

  if (command === 'insertPageBreak') {
    return insertPageBreak(view);
  }

  if (command === 'addTableRow') {
    return addRowAfter(state, dispatch);
  }

  if (command === 'addTableColumn') {
    return addColumnAfter(state, dispatch);
  }

  if (command === 'deleteTableRow') {
    return deleteRow(state, dispatch);
  }

  if (command === 'deleteTableColumn') {
    return deleteColumn(state, dispatch);
  }

  if (command === 'mergeTableCells') {
    return mergeCells(state, dispatch);
  }

  if (command === 'splitTableCell') {
    return splitCell(state, dispatch);
  }

  if (command === 'deleteTable') {
    return deleteTable(state, dispatch);
  }

  if (command === 'undo') {
    return undo(state, dispatch, view);
  }

  if (command === 'toggleAnalysis') {
    dispatch(toggleAnalysisDecorations(state.tr));
    return true;
  }

  return redo(state, dispatch, view);
}

function insertBasicTable(view: EditorView): boolean {
  const { table, table_row, table_cell } = writeSplatSchema.nodes;
  const paragraph = writeSplatSchema.nodes.paragraph;
  const rows = Array.from({ length: 3 }, () =>
    table_row.create(
      null,
      Array.from({ length: 3 }, () => table_cell.createAndFill(null, paragraph.create()) ?? table_cell.create()),
    ),
  );
  const tableNode = table.create(null, rows);
  view.dispatch(view.state.tr.replaceSelectionWith(tableNode).scrollIntoView());
  view.focus();
  return true;
}

function insertHorizontalRule(view: EditorView): boolean {
  const horizontalRule = writeSplatSchema.nodes.horizontal_rule.create();
  view.dispatch(view.state.tr.replaceSelectionWith(horizontalRule).scrollIntoView());
  view.focus();
  return true;
}

function insertPageBreak(view: EditorView): boolean {
  const pageBreak = writeSplatSchema.nodes.page_break.create();
  view.dispatch(view.state.tr.replaceSelectionWith(pageBreak).scrollIntoView());
  view.focus();
  return true;
}
