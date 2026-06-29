import { findAnalysisRanges } from '../analysis/ranges';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Plugin, PluginKey, type Transaction } from 'prosemirror-state';
import type { Node as ProseMirrorNode } from 'prosemirror-model';

interface AnalysisPluginState {
  enabled: boolean;
  targetGrade: number;
  decorations: DecorationSet;
}

const analysisPluginKey = new PluginKey<AnalysisPluginState>('writesplat-analysis');
const ANALYSIS_DEBOUNCE_MS = 300;

type AnalysisPluginMeta = {
  refresh?: boolean;
  targetGrade?: number;
  toggle?: boolean;
};

export function createAnalysisPlugin(targetGrade = 6): Plugin<AnalysisPluginState> {
  return new Plugin<AnalysisPluginState>({
    key: analysisPluginKey,
    state: {
      init(_, state) {
        return {
          enabled: true,
          targetGrade,
          decorations: buildDecorations(state.doc, targetGrade),
        };
      },
      apply(transaction: Transaction, pluginState) {
        const meta = transaction.getMeta(analysisPluginKey) as AnalysisPluginMeta | undefined;
        const enabled = meta?.toggle ? !pluginState.enabled : pluginState.enabled;
        const nextTargetGrade = typeof meta?.targetGrade === 'number' ? meta.targetGrade : pluginState.targetGrade;

        if (!enabled) {
          return {
            enabled,
            targetGrade: nextTargetGrade,
            decorations: DecorationSet.empty,
          };
        }

        if (meta?.refresh || meta?.toggle || typeof meta?.targetGrade === 'number') {
          return {
            enabled,
            targetGrade: nextTargetGrade,
            decorations: buildDecorations(transaction.doc, nextTargetGrade),
          };
        }

        if (transaction.docChanged) {
          return {
            enabled,
            targetGrade: nextTargetGrade,
            decorations: DecorationSet.empty,
          };
        }

        return {
          enabled,
          targetGrade: nextTargetGrade,
          decorations: pluginState.decorations.map(transaction.mapping, transaction.doc),
        };
      },
    },
    view() {
      let analysisTimer: number | null = null;

      return {
        update(view, previousState) {
          const pluginState = analysisPluginKey.getState(view.state);

          if (!pluginState?.enabled) {
            if (analysisTimer) {
              window.clearTimeout(analysisTimer);
              analysisTimer = null;
            }
            return;
          }

          if (previousState.doc.eq(view.state.doc)) {
            return;
          }

          if (analysisTimer) {
            window.clearTimeout(analysisTimer);
          }

          analysisTimer = window.setTimeout(() => {
            analysisTimer = null;
            view.dispatch(view.state.tr.setMeta(analysisPluginKey, { refresh: true } satisfies AnalysisPluginMeta));
          }, ANALYSIS_DEBOUNCE_MS);
        },
        destroy() {
          if (analysisTimer) {
            window.clearTimeout(analysisTimer);
          }
        },
      };
    },
    props: {
      decorations(state) {
        return analysisPluginKey.getState(state)?.decorations ?? DecorationSet.empty;
      },
    },
  });
}

export function toggleAnalysisDecorations(transaction: Transaction): Transaction {
  return transaction.setMeta(analysisPluginKey, { toggle: true });
}

export function setAnalysisTargetGrade(transaction: Transaction, targetGrade: number): Transaction {
  return transaction.setMeta(analysisPluginKey, { targetGrade });
}

function buildDecorations(doc: ProseMirrorNode, targetGrade: number): DecorationSet {
  const ranges = findAnalysisRanges(collectTextBlocks(doc), targetGrade);
  const decorations = ranges
    .filter((range) => range.to > range.from)
    .map((range) =>
      Decoration.inline(range.from, range.to, {
        class: `analysis-highlight analysis-${range.kind}`,
        'data-analysis-kind': range.kind,
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
