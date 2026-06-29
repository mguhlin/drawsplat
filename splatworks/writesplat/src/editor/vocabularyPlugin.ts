import { findVocabularyRanges } from '../analysis/vocabulary';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Plugin, PluginKey, type Transaction } from 'prosemirror-state';
import type { Node as ProseMirrorNode } from 'prosemirror-model';

interface VocabularyPluginState {
  terms: string[];
  decorations: DecorationSet;
}

const vocabularyPluginKey = new PluginKey<VocabularyPluginState>('writesplat-vocabulary');

export function createVocabularyPlugin(): Plugin<VocabularyPluginState> {
  return new Plugin<VocabularyPluginState>({
    key: vocabularyPluginKey,
    state: {
      init() {
        return {
          terms: [],
          decorations: DecorationSet.empty,
        };
      },
      apply(transaction: Transaction, pluginState) {
        const meta = transaction.getMeta(vocabularyPluginKey) as { terms?: string[] } | undefined;
        const terms = meta?.terms ?? pluginState.terms;

        if (terms.length === 0) {
          return {
            terms,
            decorations: DecorationSet.empty,
          };
        }

        if (transaction.docChanged || meta?.terms) {
          return {
            terms,
            decorations: buildVocabularyDecorations(transaction.doc, terms),
          };
        }

        return {
          terms,
          decorations: pluginState.decorations.map(transaction.mapping, transaction.doc),
        };
      },
    },
    props: {
      decorations(state) {
        return vocabularyPluginKey.getState(state)?.decorations ?? DecorationSet.empty;
      },
    },
  });
}

export function setVocabularyTerms(transaction: Transaction, terms: string[]): Transaction {
  return transaction.setMeta(vocabularyPluginKey, { terms });
}

function buildVocabularyDecorations(doc: ProseMirrorNode, terms: string[]): DecorationSet {
  const ranges = findVocabularyRanges(collectTextBlocks(doc), terms);
  const decorations = ranges.map((range) =>
    Decoration.inline(range.from, range.to, {
      class: 'vocabulary-highlight',
      'data-vocabulary-term': range.term,
      title: `Vocabulary: ${range.term}`,
    }),
  );

  return DecorationSet.create(doc, decorations);
}

function collectTextBlocks(doc: ProseMirrorNode): Array<{ text: string; from: number }> {
  const blocks: Array<{ text: string; from: number }> = [];

  doc.descendants((node, pos) => {
    if (!node.isTextblock) {
      return true;
    }

    let text = '';
    let firstTextPos: number | null = null;

    node.descendants((child, childPos) => {
      if (child.isText) {
        firstTextPos ??= pos + 1 + childPos;
        text += child.text ?? '';
      }

      return true;
    });

    if (text && firstTextPos !== null) {
      blocks.push({ text, from: firstTextPos });
    }

    return false;
  });

  return blocks;
}
