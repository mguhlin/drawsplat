import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { Plugin, PluginKey, type Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

interface ReadAloudPluginState {
  decorations: DecorationSet;
}

const readAloudPluginKey = new PluginKey<ReadAloudPluginState>('writesplat-read-aloud');

export function createReadAloudPlugin(): Plugin<ReadAloudPluginState> {
  return new Plugin<ReadAloudPluginState>({
    key: readAloudPluginKey,
    state: {
      init() {
        return { decorations: DecorationSet.empty };
      },
      apply(transaction: Transaction, pluginState) {
        const meta = transaction.getMeta(readAloudPluginKey) as { from?: number; to?: number; clear?: boolean } | undefined;

        if (meta?.clear) {
          return { decorations: DecorationSet.empty };
        }

        if (typeof meta?.from === 'number' && typeof meta?.to === 'number' && meta.to > meta.from) {
          return {
            decorations: DecorationSet.create(transaction.doc, [
              Decoration.inline(meta.from, meta.to, {
                class: 'read-aloud-highlight',
                'data-read-aloud-current': 'true',
              }),
            ]),
          };
        }

        return {
          decorations: pluginState.decorations.map(transaction.mapping, transaction.doc),
        };
      },
    },
    props: {
      decorations(state) {
        return readAloudPluginKey.getState(state)?.decorations ?? DecorationSet.empty;
      },
    },
  });
}

export function setReadAloudRange(transaction: Transaction, from: number, to: number): Transaction {
  return transaction.setMeta(readAloudPluginKey, { from, to });
}

export function clearReadAloudRange(transaction: Transaction): Transaction {
  return transaction.setMeta(readAloudPluginKey, { clear: true });
}

export function textRangeFromOffset(doc: ProseMirrorNode, offset: number, length: number): { from: number; to: number } | null {
  const target = Math.max(0, offset);
  const targetEnd = target + Math.max(1, length);
  let seen = 0;
  let from: number | null = null;
  let to: number | null = null;

  doc.descendants((node, pos) => {
    if (!node.isText) {
      return true;
    }

    const text = node.text ?? '';
    const start = seen;
    const end = seen + text.length;

    if (from === null && target >= start && target < end) {
      from = pos + target - start;
    }

    if (from !== null && targetEnd >= start && targetEnd <= end) {
      to = pos + targetEnd - start;
      return false;
    }

    seen = end;
    return true;
  });

  if (from === null) {
    return null;
  }

  return { from, to: to ?? from + 1 };
}
