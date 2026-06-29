import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';

const BLOCK_DRAG_MIME = 'application/x-writesplat-block-pos';

interface BlockInfo {
  node: ProseMirrorNode;
  pos: number;
}

export function createBlockDragPlugin(): Plugin {
  let pointerDragSource: BlockInfo | null = null;

  return new Plugin({
    props: {
      decorations(state) {
        const decorations: Decoration[] = [];

        state.doc.forEach((node, offset) => {
          decorations.push(
            Decoration.widget(offset, () => {
              const handle = document.createElement('span');
              handle.className = 'block-drag-handle';
              handle.draggable = true;
              handle.dataset.blockPos = String(offset);
              handle.contentEditable = 'false';
              handle.setAttribute('aria-label', 'Drag block');
              handle.setAttribute('role', 'button');
              return handle;
            }, { side: -1 }),
          );
          decorations.push(
            Decoration.node(offset, offset + node.nodeSize, {
              class: 'draggable-block',
            }),
          );
        });

        return DecorationSet.create(state.doc, decorations);
      },
      handleDOMEvents: {
        mousedown(view, event) {
          if (!(event instanceof MouseEvent)) {
            return false;
          }

          pointerDragSource = blockFromHandleTarget(view, event.target);

          if (pointerDragSource) {
            event.preventDefault();
            return true;
          }

          return false;
        },
        mouseup(view, event) {
          if (!(event instanceof MouseEvent) || !pointerDragSource) {
            return false;
          }

          const target = blockAtMouseEvent(view, event);
          const source = pointerDragSource;
          pointerDragSource = null;

          if (!target || source.pos === target.pos) {
            return false;
          }

          event.preventDefault();
          moveBlock(view, source, target, dropAfterTarget(view, target, event));
          return true;
        },
        dragstart(view, event) {
          const block = blockFromDragHandle(view, event) ?? blockAtEvent(view, event);

          if (!block || !event.dataTransfer) {
            return false;
          }

          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData(BLOCK_DRAG_MIME, String(block.pos));
          return false;
        },
        dragover(_view, event) {
          if (event.dataTransfer?.types.includes(BLOCK_DRAG_MIME)) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            return true;
          }

          return false;
        },
        drop(view, event) {
          const rawSourcePos = event.dataTransfer?.getData(BLOCK_DRAG_MIME);

          if (!rawSourcePos) {
            return false;
          }

          const sourcePos = Number(rawSourcePos);
          const target = blockAtEvent(view, event);
          const source = topLevelBlockAt(view.state.doc, sourcePos);

          if (!source || !target || source.pos === target.pos) {
            return true;
          }

          event.preventDefault();
          moveBlock(view, source, target, dropAfterTarget(view, target, event));
          return true;
        },
      },
    },
  });
}

function blockFromDragHandle(view: EditorView, event: DragEvent): BlockInfo | null {
  return blockFromHandleTarget(view, event.target);
}

function blockFromHandleTarget(view: EditorView, eventTarget: EventTarget | null): BlockInfo | null {
  const target = eventTarget instanceof HTMLElement ? eventTarget.closest<HTMLElement>('.block-drag-handle') : null;
  const pos = Number(target?.dataset.blockPos);
  return Number.isFinite(pos) ? topLevelBlockAt(view.state.doc, pos) : null;
}

function blockAtEvent(view: EditorView, event: DragEvent): BlockInfo | null {
  const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
  return typeof pos === 'number' ? topLevelBlockAt(view.state.doc, pos) : null;
}

function blockAtMouseEvent(view: EditorView, event: MouseEvent): BlockInfo | null {
  const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
  return typeof pos === 'number' ? topLevelBlockAt(view.state.doc, pos) : null;
}

function topLevelBlockAt(doc: ProseMirrorNode, pos: number): BlockInfo | null {
  let found: BlockInfo | null = null;

  doc.forEach((node, offset) => {
    if (found) {
      return;
    }

    if (pos >= offset && pos <= offset + node.nodeSize) {
      found = { node, pos: offset };
    }
  });

  return found;
}

function dropAfterTarget(view: EditorView, target: BlockInfo, event: MouseEvent): boolean {
  const targetDom = view.nodeDOM(target.pos);

  if (!(targetDom instanceof HTMLElement)) {
    return false;
  }

  const rect = targetDom.getBoundingClientRect();
  return event.clientY > rect.top + rect.height / 2;
}

function moveBlock(view: EditorView, source: BlockInfo, target: BlockInfo, afterTarget: boolean): void {
  const sourceEnd = source.pos + source.node.nodeSize;
  const targetInsertPos = target.pos + (afterTarget ? target.node.nodeSize : 0);

  if (targetInsertPos >= source.pos && targetInsertPos <= sourceEnd) {
    return;
  }

  const insertPos = targetInsertPos > source.pos ? targetInsertPos - source.node.nodeSize : targetInsertPos;
  const transaction = view.state.tr.delete(source.pos, sourceEnd).insert(insertPos, source.node).scrollIntoView();
  view.dispatch(transaction);
}
