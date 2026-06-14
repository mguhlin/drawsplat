import {
  type ClipboardEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ChangeEvent,
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ArrowDownAZ,
  ArrowDownZA,
  DollarSign,
  Eraser,
  Merge,
  Minus,
  PaintBucket,
  Percent,
  Plus,
  Sigma,
  Square,
  Type,
  WrapText,
} from 'lucide-react';
import { ChartCanvas } from '../charts/ChartCanvas';
import {
  buildFirstDataRangeChart,
  buildChartData,
  findChartValueColumn,
  findFirstDataRangeSelection,
  type ChartDataModel,
  type ChartKind,
} from '../charts/chartData';
import { loadAutosave, saveAutosave } from '../io/autosave';
import { exportCsv, importCsv } from '../io/csv';
import { cloudProviders } from '../io/cloud/providers';
import { downloadBuffer, downloadText } from '../io/download';
import { exportNativeJson, importNativeJson } from '../io/json';
import { saveSheetLocally } from '../io/localFile';
import {
  exportMarkdown,
  importMarkdown,
  markdownToMatrix,
} from '../io/markdown';
import { matrixToSheet, sheetToMatrix, type SheetMatrix } from '../io/matrix';
import { strings } from '../i18n/strings';
import {
  clearCells,
  applyCellFormat,
  clearCellFormat,
  createSheet,
  getColumnName,
  isCellInSelection,
  mergeCells,
  normalizeSelection,
  parsePastedText,
  pasteCells,
  serializeSelection,
  sortRows,
  updateCell,
} from './gridModel';
import type {
  CellAddress,
  CellFormat,
  CellTextAlign,
  CellVerticalAlign,
  SelectionRange,
  SheetData,
} from './types';

const DEFAULT_ROWS = 20;
const DEFAULT_COLS = 20;
const DEFAULT_ROW_HEIGHT = 56;
const DEFAULT_COL_WIDTH = 120;
const HEADER_SIZE = 48;
const OVERSCAN = 4;
const MIN_COL_WIDTH = 72;
const MAX_DRAG_COL_WIDTH = 240;
const MAX_AUTOFIT_COL_WIDTH = 520;
const CELL_TEXT_PADDING = 32;
const MIN_CHART_PANEL_WIDTH = 320;
const MIN_CHART_PANEL_HEIGHT = 300;
const FONT_FAMILIES = [
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Calibri', value: 'Calibri, Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Mono', value: 'monospace' },
] as const;

type NumberFormat = 'plain' | 'whole' | 'decimal' | 'currency' | 'percent';
type ExportFormat = 'json' | 'csv' | 'markdown' | 'xlsx';
type GridAction =
  | { action: 'chart'; chartType: ChartKind }
  | { action: 'chart-title'; title: string }
  | { action: 'export-file'; format: ExportFormat }
  | {
      action:
        | 'cloud-open'
        | 'cloud-save'
        | 'copy'
        | 'export-chart'
        | 'new-sheet'
        | 'open-file'
        | 'paste'
        | 'redo'
        | 'save-file'
        | 'undo';
      providerName?: string;
    };

interface ResizeState {
  type: 'row' | 'col';
  index: number;
  startPointer: number;
  startSize: number;
}

type FreezeDragAxis = 'row' | 'col';

interface ChartSourceRow {
  label: string;
  row: number;
  value: number;
  valueCol: number;
}

interface ChartPanelPosition {
  left: number;
  top: number;
}

interface ChartPanelDragState {
  startLeft: number;
  startPointerX: number;
  startPointerY: number;
  startTop: number;
}

interface ChartPanelSize {
  height: number;
  width: number;
}

type ChartResizeHandle = 'bottom' | 'corner' | 'right';

interface ChartPanelResizeState {
  handle: ChartResizeHandle;
  startHeight: number;
  startLeft: number;
  startPointerX: number;
  startPointerY: number;
  startTop: number;
  startWidth: number;
}

interface SpreadsheetGridProps {
  onSheetUpdated?: (matrix: SheetMatrix) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createSelection(address: CellAddress): SelectionRange {
  return {
    start: address,
    end: address,
  };
}

function buildOffsets(sizes: number[]): number[] {
  return sizes.reduce<number[]>((offsets, size, index) => {
    const previousOffset = offsets[index - 1] ?? HEADER_SIZE;
    const previousSize = sizes[index - 1] ?? 0;

    return [...offsets, previousOffset + previousSize];
  }, []);
}

function countFrozenItems(
  sizes: number[],
  offsets: number[],
  pointerPosition: number,
): number {
  if (pointerPosition <= HEADER_SIZE) {
    return 0;
  }

  return sizes.reduce((count, size, index) => {
    const midpoint = offsets[index] + size / 2;

    return pointerPosition >= midpoint ? index + 1 : count;
  }, 0);
}

function getChartSourceRows(
  sheet: SheetData,
  selection: SelectionRange,
): ChartSourceRow[] {
  const normalized = normalizeSelection(selection);
  const valueCol = findChartValueColumn(sheet, selection);
  const rows: ChartSourceRow[] = [];

  for (let row = normalized.start.row; row <= normalized.end.row; row += 1) {
    const labelCell = sheet[row]?.[normalized.start.col];
    const valueCell = sheet[row]?.[valueCol];
    const value = Number(valueCell?.displayValue ?? valueCell?.rawValue ?? '');

    if (Number.isFinite(value)) {
      rows.push({
        label:
          labelCell?.displayValue || labelCell?.rawValue || `Row ${row + 1}`,
        row,
        value,
        valueCol,
      });
    }
  }

  return rows;
}

export function SpreadsheetGrid({ onSheetUpdated }: SpreadsheetGridProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartPanelRef = useRef<HTMLElement>(null);
  const measuringCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartPanelResizeStateRef = useRef<ChartPanelResizeState | null>(null);
  const [sheet, setSheet] = useState<SheetData>(() => {
    try {
      return loadAutosave() ?? createSheet(DEFAULT_ROWS, DEFAULT_COLS);
    } catch {
      return createSheet(DEFAULT_ROWS, DEFAULT_COLS);
    }
  });
  const [history, setHistory] = useState<SheetData[]>([]);
  const [future, setFuture] = useState<SheetData[]>([]);
  const [selection, setSelection] = useState<SelectionRange>(() =>
    createSelection({ row: 0, col: 0 }),
  );
  const [editingCell, setEditingCell] = useState<CellAddress | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [isPlainHeaders, setIsPlainHeaders] = useState(false);
  const [dragAnchor, setDragAnchor] = useState<CellAddress | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [rowHeights, setRowHeights] = useState<number[]>(
    Array.from({ length: DEFAULT_ROWS }, () => DEFAULT_ROW_HEIGHT),
  );
  const [colWidths, setColWidths] = useState<number[]>(
    Array.from({ length: DEFAULT_COLS }, () => DEFAULT_COL_WIDTH),
  );
  const [frozenRows, setFrozenRows] = useState(0);
  const [frozenCols, setFrozenCols] = useState(0);
  const [freezeDragAxis, setFreezeDragAxis] = useState<FreezeDragAxis | null>(
    null,
  );
  const [scrollPosition, setScrollPosition] = useState({ top: 0, left: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 900, height: 620 });
  const [fileMessage, setFileMessage] = useState('');
  const [chart, setChart] = useState<ChartDataModel | null>(null);
  const [isChartPanelOpen, setIsChartPanelOpen] = useState(false);
  const [chartPanelPosition, setChartPanelPosition] =
    useState<ChartPanelPosition | null>(null);
  const [chartPanelDragState, setChartPanelDragState] =
    useState<ChartPanelDragState | null>(null);
  const [chartPanelSize, setChartPanelSize] =
    useState<ChartPanelSize | null>(null);
  const [numberFormat, setNumberFormat] = useState<NumberFormat>('plain');
  const [sheetZoom, setSheetZoom] = useState(100);
  const [chartSelection, setChartSelection] = useState<SelectionRange | null>(
    null,
  );
  const [chartTitle, setChartTitle] = useState('My Chart');
  const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      saveAutosave(sheet);
      setFileMessage('Autosaved in this browser.');
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [sheet]);

  useEffect(() => {
    const matrix = sheetToMatrix(sheet);

    onSheetUpdated?.(matrix);
    window.dispatchEvent(
      new CustomEvent('gridsplat:sheet-updated', {
        detail: matrix,
      }),
    );
  }, [onSheetUpdated, sheet]);

  useEffect(() => {
    function loadMatrix(event: Event) {
      const matrix = (event as CustomEvent<SheetMatrix>).detail;

      remember(sheet);
      setSheet(matrixToSheet(matrix));
      setSelection(createSelection({ row: 0, col: 0 }));
      setFileMessage('Loaded activity data.');
    }

    window.addEventListener('gridsplat:load-matrix', loadMatrix);

    return () =>
      window.removeEventListener('gridsplat:load-matrix', loadMatrix);
  }, [sheet]);

  useEffect(() => {
    function handleGridAction(event: Event) {
      const detail = (event as CustomEvent<GridAction>).detail;

      if (detail.action === 'new-sheet') {
        resetSheet();
      }

      if (detail.action === 'open-file') {
        fileInputRef.current?.click();
      }

      if (detail.action === 'save-file') {
        void saveLocalFile();
      }

      if (detail.action === 'export-file') {
        void exportFile(detail.format);
      }

      if (detail.action === 'export-chart') {
        exportChartPng();
      }

      if (detail.action === 'cloud-save' && detail.providerName) {
        void tryCloudProvider(detail.providerName);
      }

      if (detail.action === 'cloud-open' && detail.providerName) {
        void loadCloudProvider(detail.providerName);
      }

      if (detail.action === 'undo') {
        undo();
      }

      if (detail.action === 'redo') {
        redo();
      }

      if (detail.action === 'copy') {
        void copySelectionToClipboard();
      }

      if (detail.action === 'paste') {
        void pasteFromClipboard();
      }

      if (detail.action === 'chart') {
        makeChart(detail.chartType);
      }

      if (detail.action === 'chart-title') {
        updateChartTitle(detail.title);
      }
    }

    window.addEventListener('gridsplat:grid-action', handleGridAction);

    return () =>
      window.removeEventListener('gridsplat:grid-action', handleGridAction);
    // The event bridge depends on current sheet/selection/chart state; the
    // called handlers are plain function declarations in this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartTitle, selection, sheet]);

  const totalWidth = useMemo(
    () => HEADER_SIZE + colWidths.reduce((sum, width) => sum + width, 0),
    [colWidths],
  );
  const totalHeight = useMemo(
    () => HEADER_SIZE + rowHeights.reduce((sum, height) => sum + height, 0),
    [rowHeights],
  );

  const columnOffsets = useMemo(() => buildOffsets(colWidths), [colWidths]);
  const rowOffsets = useMemo(() => buildOffsets(rowHeights), [rowHeights]);

  const visibleRows = useMemo(
    () =>
      rowOffsets
        .map((top, row) => ({ row, top, height: rowHeights[row] }))
        .filter(
          ({ top, height }) =>
            top + height >=
              scrollPosition.top - OVERSCAN * DEFAULT_ROW_HEIGHT &&
            top <=
              scrollPosition.top +
                viewportSize.height +
                OVERSCAN * DEFAULT_ROW_HEIGHT,
        ),
    [rowHeights, rowOffsets, scrollPosition.top, viewportSize.height],
  );

  const visibleCols = useMemo(
    () =>
      columnOffsets
        .map((left, col) => ({ col, left, width: colWidths[col] }))
        .filter(
          ({ left, width }) =>
            left + width >=
              scrollPosition.left - OVERSCAN * DEFAULT_COL_WIDTH &&
            left <=
              scrollPosition.left +
                viewportSize.width +
                OVERSCAN * DEFAULT_COL_WIDTH,
        ),
    [colWidths, columnOffsets, scrollPosition.left, viewportSize.width],
  );
  const selectedCell = sheet[selection.end.row]?.[selection.end.col];
  const selectedFormat = selectedCell?.format ?? {};
  const frozenRowsList = useMemo(
    () =>
      Array.from({ length: frozenRows }, (_, row) => ({
        row,
        top: rowOffsets[row],
        height: rowHeights[row],
      })),
    [frozenRows, rowHeights, rowOffsets],
  );
  const frozenColsList = useMemo(
    () =>
      Array.from({ length: frozenCols }, (_, col) => ({
        col,
        left: columnOffsets[col],
        width: colWidths[col],
      })),
    [colWidths, columnOffsets, frozenCols],
  );
  const freezeRowBoundary =
    frozenRows === 0
      ? HEADER_SIZE
      : rowOffsets[frozenRows - 1] + rowHeights[frozenRows - 1];
  const freezeColBoundary =
    frozenCols === 0
      ? HEADER_SIZE
      : columnOffsets[frozenCols - 1] + colWidths[frozenCols - 1];
  const activeChartSelection = chartSelection ?? selection;
  const activeChart = chart
    ? buildChartData(sheet, activeChartSelection, chart.type, chart.title)
    : null;
  const activeChartRows = chart
    ? getChartSourceRows(sheet, activeChartSelection)
    : [];

  function remember(currentSheet: SheetData) {
    setHistory((previous) => [...previous.slice(-24), currentSheet]);
    setFuture([]);
  }

  function selectCell(address: CellAddress) {
    const nextAddress = {
      row: clamp(address.row, 0, DEFAULT_ROWS - 1),
      col: clamp(address.col, 0, DEFAULT_COLS - 1),
    };

    setSelection(createSelection(nextAddress));
    setEditingCell(null);
  }

  function beginEditing(address: CellAddress) {
    setSelection(createSelection(address));
    setEditingCell(address);
    setDraftValue(sheet[address.row][address.col].rawValue);
  }

  function beginEditingWithValue(address: CellAddress, value: string) {
    setSelection(createSelection(address));
    setEditingCell(address);
    setDraftValue(value);
  }

  function commitEditing(moveDown = false) {
    if (!editingCell) {
      return;
    }

    const target = editingCell;

    setSheet((currentSheet) => {
      remember(currentSheet);
      return updateCell(currentSheet, target, draftValue);
    });
    setEditingCell(null);

    if (moveDown) {
      selectCell({ row: target.row + 1, col: target.col });
    }
  }

  function cancelEditing() {
    setEditingCell(null);
    setDraftValue('');
  }

  function undo() {
    setHistory((previous) => {
      const priorSheet = previous.at(-1);

      if (priorSheet) {
        setFuture((next) => [sheet, ...next].slice(0, 25));
        setSheet(priorSheet);
      }

      return previous.slice(0, -1);
    });
    setEditingCell(null);
  }

  function redo() {
    setFuture((previous) => {
      const nextSheet = previous[0];

      if (nextSheet) {
        setHistory((nextHistory) => [...nextHistory.slice(-24), sheet]);
        setSheet(nextSheet);
      }

      return previous.slice(1);
    });
    setEditingCell(null);
  }

  function clearSelection() {
    setSheet((currentSheet) => {
      remember(currentSheet);
      setFileMessage('Cleared selected cells.');

      return clearCells(currentSheet, selection);
    });
  }

  function selectedCellsEvery(
    predicate: (format: CellFormat | undefined) => boolean,
  ) {
    const normalized = normalizeSelection(selection);

    for (let row = normalized.start.row; row <= normalized.end.row; row += 1) {
      for (
        let col = normalized.start.col;
        col <= normalized.end.col;
        col += 1
      ) {
        if (!predicate(sheet[row]?.[col]?.format)) {
          return false;
        }
      }
    }

    return true;
  }

  function updateSelectionFormat(format: CellFormat) {
    setSheet((currentSheet) => {
      remember(currentSheet);
      setFileMessage('Formatted selected cells.');

      return applyCellFormat(currentSheet, selection, format);
    });
  }

  function toggleBooleanFormat(
    key:
      | 'bold'
      | 'border'
      | 'italic'
      | 'strikethrough'
      | 'underline'
      | 'wrapText',
  ) {
    const nextValue = !selectedCellsEvery((format) => Boolean(format?.[key]));

    updateSelectionFormat({ [key]: nextValue });
  }

  function mergeSelectedCells() {
    setSheet((currentSheet) => {
      remember(currentSheet);
      setFileMessage('Merged selected cells.');

      return mergeCells(currentSheet, selection);
    });
  }

  function clearSelectedFormatting() {
    setSheet((currentSheet) => {
      remember(currentSheet);
      setFileMessage('Cleared selected formatting.');

      return clearCellFormat(currentSheet, selection);
    });
  }

  function setCellFontFamily(fontFamily: string) {
    updateSelectionFormat({ fontFamily });
  }

  function setCellFontSize(fontSize: number) {
    updateSelectionFormat({ fontSize: clamp(fontSize, 8, 32) });
  }

  function setAlignment(align: CellTextAlign) {
    updateSelectionFormat({ align });
  }

  function setVerticalAlignment(verticalAlign: CellVerticalAlign) {
    updateSelectionFormat({ verticalAlign });
  }

  function setCellTextColor(textColor: string) {
    updateSelectionFormat({ textColor });
  }

  function setCellFillColor(backgroundColor: string) {
    updateSelectionFormat({ backgroundColor });
  }

  function sortSelectedRows(direction: 'ascending' | 'descending') {
    setSheet((currentSheet) => {
      remember(currentSheet);
      setFileMessage(
        direction === 'ascending'
          ? 'Sorted selected rows A to Z.'
          : 'Sorted selected rows Z to A.',
      );

      return sortRows(currentSheet, selection, selection.end.col, direction);
    });
  }

  function autoSumSelection() {
    const normalized = normalizeSelection(selection);
    const values: number[] = [];

    for (let row = normalized.start.row; row <= normalized.end.row; row += 1) {
      for (
        let col = normalized.start.col;
        col <= normalized.end.col;
        col += 1
      ) {
        const value = Number(sheet[row]?.[col]?.displayValue ?? '');

        if (Number.isFinite(value)) {
          values.push(value);
        }
      }
    }

    if (values.length === 0) {
      setFileMessage('Select number cells before using AutoSum.');
      return;
    }

    const target = {
      row: clamp(normalized.end.row + 1, 0, DEFAULT_ROWS - 1),
      col: normalized.end.col,
    };
    const sum = values.reduce((total, value) => total + value, 0);

    setSheet((currentSheet) => {
      remember(currentSheet);
      setFileMessage(`AutoSum added ${sum}.`);

      return updateCell(currentSheet, target, String(sum));
    });
    setSelection(createSelection(target));
  }

  function setZoom(nextZoom: number) {
    setSheetZoom(clamp(nextZoom, 50, 150));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (editingCell) {
      return;
    }

    const active = selection.end;
    const isShortcut = event.ctrlKey || event.metaKey;

    if (isShortcut && event.key.toLowerCase() === 'z') {
      event.preventDefault();

      if (event.shiftKey) {
        redo();
        return;
      }

      undo();
      return;
    }

    if (isShortcut && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      redo();
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      clearSelection();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      beginEditing(active);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectCell({ row: active.row + 1, col: active.col });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectCell({ row: active.row - 1, col: active.col });
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'Tab') {
      event.preventDefault();
      selectCell({
        row: active.row,
        col: active.col + (event.shiftKey ? -1 : 1),
      });
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      selectCell({ row: active.row, col: active.col - 1 });
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      selectCell({ row: active.row, col: 0 });
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      selectCell({ row: active.row, col: DEFAULT_COLS - 1 });
      return;
    }

    if (
      event.key.length === 1 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      event.preventDefault();
      beginEditingWithValue(active, event.key);
    }
  }

  function handleCellPointerDown(
    event: PointerEvent<HTMLDivElement>,
    address: CellAddress,
  ) {
    if (event.shiftKey) {
      setDragAnchor(null);
      setSelection({
        start: selection.start,
        end: address,
      });
      setEditingCell(null);
      return;
    }

    setDragAnchor(address);
    setSelection(createSelection(address));
    setEditingCell(null);
  }

  function handleCellPointerEnter(address: CellAddress) {
    if (!dragAnchor) {
      return;
    }

    setSelection({
      start: dragAnchor,
      end: address,
    });
  }

  function handleCellPointerUp(
    event: PointerEvent<HTMLDivElement>,
    address: CellAddress,
  ) {
    if (
      event.pointerType === 'touch' &&
      dragAnchor &&
      dragAnchor.row === address.row &&
      dragAnchor.col === address.col
    ) {
      beginEditing(address);
    }

    setDragAnchor(null);
  }

  function handleCopy(event: ClipboardEvent<HTMLDivElement>) {
    event.clipboardData.setData(
      'text/plain',
      serializeSelection(sheet, selection),
    );
    event.preventDefault();
  }

  function pasteTextIntoSheet(pastedText: string) {
    try {
      const values =
        pastedText.includes('|') && pastedText.includes('---')
          ? markdownToMatrix(pastedText)
          : parsePastedText(pastedText);

      setSheet((currentSheet) => {
        remember(currentSheet);
        setEditingCell(null);
        setFileMessage('Pasted table into the sheet.');

        return pasteCells(currentSheet, selection.start, values);
      });
    } catch (error) {
      setFileMessage(
        error instanceof Error
          ? `We couldn't paste that table: ${error.message}`
          : "We couldn't paste that table.",
      );
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const pastedText = event.clipboardData.getData('text/plain');

    if (!pastedText) {
      return;
    }

    event.preventDefault();
    pasteTextIntoSheet(pastedText);
  }

  async function copySelectionToClipboard() {
    try {
      await navigator.clipboard.writeText(serializeSelection(sheet, selection));
      setFileMessage('Copied the selected cells.');
    } catch (error) {
      setFileMessage(
        error instanceof Error
          ? `We couldn't copy those cells: ${error.message}`
          : "We couldn't copy those cells.",
      );
    }
  }

  async function pasteFromClipboard() {
    try {
      const pastedText = await navigator.clipboard.readText();

      if (!pastedText) {
        setFileMessage('The clipboard is empty.');
        return;
      }

      pasteTextIntoSheet(pastedText);
    } catch (error) {
      setFileMessage(
        error instanceof Error
          ? `We couldn't read the clipboard: ${error.message}`
          : "We couldn't read the clipboard.",
      );
    }
  }

  async function exportFile(format: 'json' | 'csv' | 'markdown' | 'xlsx') {
    if (format === 'json') {
      downloadText(
        'gridsplat.gridsplat.json',
        exportNativeJson(sheet),
        'application/json',
      );
      setFileMessage('Downloaded a GridSplat™ JSON file.');
    }

    if (format === 'csv') {
      downloadText('gridsplat.csv', exportCsv(sheet), 'text/csv');
      setFileMessage('Downloaded a CSV file.');
    }

    if (format === 'markdown') {
      downloadText('gridsplat.md', exportMarkdown(sheet), 'text/markdown');
      setFileMessage('Downloaded a Markdown table.');
    }

    if (format === 'xlsx') {
      const { excelMimeType, exportExcel } = await import('../io/excel');

      downloadBuffer('gridsplat.xlsx', await exportExcel(sheet), excelMimeType());
      setFileMessage('Downloaded an Excel workbook.');
    }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const isExcelFile =
        file.name.endsWith('.xlsx') ||
        file.type ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const nextSheet = isExcelFile
        ? await import('../io/excel').then(async ({ importExcel }) =>
            importExcel(await file.arrayBuffer()),
          )
        : await file.text().then((text) =>
            file.name.endsWith('.gridsplat.json') || file.name.endsWith('.json')
              ? importNativeJson(text)
              : file.name.endsWith('.md') || file.name.endsWith('.markdown')
                ? importMarkdown(text)
                : importCsv(text),
          );

      remember(sheet);
      setSheet(nextSheet);
      setSelection(createSelection({ row: 0, col: 0 }));
      setEditingCell(null);
      setFileMessage(`Opened ${file.name}.`);
    } catch (error) {
      setFileMessage(
        error instanceof Error
          ? `We couldn't read that file: ${error.message}`
          : "We couldn't read that file.",
      );
    } finally {
      event.target.value = '';
    }
  }

  async function saveLocalFile() {
    setFileMessage(await saveSheetLocally(sheet));
  }

  async function tryCloudProvider(providerName: string) {
    const provider = cloudProviders.find((item) => item.name === providerName);

    if (!provider) {
      return;
    }

    if (!isOnline) {
      setFileMessage(`${provider.name} needs an internet connection.`);
      return;
    }

    try {
      const fileId = await provider.save(sheet);

      setFileMessage(
        fileId
          ? `Saved to ${provider.name}.`
          : `Connected to ${provider.name}.`,
      );
    } catch (error) {
      setFileMessage(
        error instanceof Error
          ? error.message
          : `${provider.name} is not connected yet.`,
      );
    }
  }

  async function loadCloudProvider(providerName: string) {
    const provider = cloudProviders.find((item) => item.name === providerName);
    const fileId = provider?.getLastFileId();

    if (!provider) {
      return;
    }

    if (!isOnline) {
      setFileMessage(`${provider.name} needs an internet connection.`);
      return;
    }

    if (!fileId) {
      setFileMessage(`Save to ${provider.name} before reopening from it.`);
      return;
    }

    try {
      remember(sheet);
      setSheet(await provider.load(fileId));
      setSelection(createSelection({ row: 0, col: 0 }));
      setEditingCell(null);
      setFileMessage(`Opened the last ${provider.name} save.`);
    } catch (error) {
      setFileMessage(
        error instanceof Error
          ? error.message
          : `${provider.name} could not open the last save.`,
      );
    }
  }

  function makeChart(type: ChartKind) {
    let nextChart = buildChartData(sheet, selection, type, chartTitle);
    let nextSelection = selection;

    if (nextChart.points.length === 0) {
      nextChart = buildFirstDataRangeChart(sheet, type, chartTitle);
      nextSelection =
        findFirstDataRangeSelection(sheet) ??
        createSelection({ row: 0, col: 0 });
    }

    if (nextChart.points.length === 0) {
      setFileMessage('Select labels and numbers before making a chart.');
      return;
    }

    setChart(nextChart);
    setChartSelection(nextSelection);
    setIsChartPanelOpen(true);
    setFileMessage('Chart ready.');
  }

  function updateChartTitle(title: string) {
    setChartTitle(title);
    setChart((current) => (current ? { ...current, title } : current));
  }

  function exportChartPng() {
    const canvas = document.querySelector<HTMLCanvasElement>(
      '[data-testid="chart-canvas"]',
    );

    if (!canvas) {
      setFileMessage('Make a chart before exporting an image.');
      return;
    }

    const anchor = document.createElement('a');

    anchor.href = canvas.toDataURL('image/png');
    anchor.download = 'gridsplat-chart.png';
    anchor.click();
    setFileMessage('Downloaded a chart image.');
  }

  function copyChartPng() {
    const canvas = document.querySelector<HTMLCanvasElement>(
      '[data-testid="chart-canvas"]',
    );

    if (!canvas) {
      setFileMessage('Make a chart before copying an image.');
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob || !navigator.clipboard || !window.ClipboardItem) {
        setFileMessage('Copying chart images is not available here.');
        return;
      }

      void navigator.clipboard
        .write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ])
        .then(() => setFileMessage('Copied chart image.'))
        .catch((error: unknown) =>
          setFileMessage(
            error instanceof Error
              ? `We couldn't copy that chart: ${error.message}`
              : "We couldn't copy that chart.",
          ),
        );
    }, 'image/png');
  }

  function startChartValueAdjust() {
    remember(sheet);
  }

  function updateChartPointValue(pointIndex: number, nextValue: number) {
    const sourceRow = activeChartRows[pointIndex];

    if (!sourceRow) {
      return;
    }

    const roundedValue = Math.max(0, nextValue);
    const displayValue = Number.isInteger(roundedValue)
      ? String(roundedValue)
      : roundedValue.toFixed(1).replace(/\.0$/, '');

    setSheet((currentSheet) =>
      updateCell(
        currentSheet,
        { row: sourceRow.row, col: sourceRow.valueCol },
        displayValue,
      ),
    );
    setFileMessage('Updated chart value.');
  }

  function startChartPanelDrag(event: PointerEvent<HTMLButtonElement>) {
    const panel = chartPanelRef.current;

    if (!panel) {
      return;
    }

    const bounds = panel.getBoundingClientRect();

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setChartPanelPosition({
      left: bounds.left,
      top: bounds.top,
    });
    setChartPanelDragState({
      startLeft: bounds.left,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startTop: bounds.top,
    });
  }

  function continueChartPanelDrag(event: PointerEvent<HTMLButtonElement>) {
    const panel = chartPanelRef.current;

    if (!panel || !chartPanelDragState) {
      return;
    }

    const bounds = panel.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - bounds.width);
    const maxTop = Math.max(0, window.innerHeight - bounds.height);

    setChartPanelPosition({
      left: clamp(
        chartPanelDragState.startLeft +
          event.clientX -
          chartPanelDragState.startPointerX,
        0,
        maxLeft,
      ),
      top: clamp(
        chartPanelDragState.startTop +
          event.clientY -
          chartPanelDragState.startPointerY,
        0,
        maxTop,
      ),
    });
  }

  function stopChartPanelDrag() {
    setChartPanelDragState(null);
  }

  function startChartPanelResize(
    handle: ChartResizeHandle,
    event: PointerEvent<HTMLButtonElement>,
  ) {
    const panel = chartPanelRef.current;

    if (!panel) {
      return;
    }

    const bounds = panel.getBoundingClientRect();

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setChartPanelPosition({
      left: bounds.left,
      top: bounds.top,
    });
    setChartPanelSize({
      height: bounds.height,
      width: bounds.width,
    });
    chartPanelResizeStateRef.current = {
      handle,
      startHeight: bounds.height,
      startLeft: bounds.left,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startTop: bounds.top,
      startWidth: bounds.width,
    };
  }

  function continueChartPanelResize(event: PointerEvent<HTMLButtonElement>) {
    const resizeState = chartPanelResizeStateRef.current;

    if (!resizeState) {
      return;
    }

    const deltaX = event.clientX - resizeState.startPointerX;
    const deltaY = event.clientY - resizeState.startPointerY;
    const maxWidth = Math.max(
      MIN_CHART_PANEL_WIDTH,
      window.innerWidth - resizeState.startLeft,
    );
    const maxHeight = Math.max(
      MIN_CHART_PANEL_HEIGHT,
      window.innerHeight - resizeState.startTop,
    );
    const canResizeWidth =
      resizeState.handle === 'right' || resizeState.handle === 'corner';
    const canResizeHeight =
      resizeState.handle === 'bottom' || resizeState.handle === 'corner';

    setChartPanelSize({
      height: canResizeHeight
        ? clamp(
            resizeState.startHeight + deltaY,
            MIN_CHART_PANEL_HEIGHT,
            maxHeight,
          )
        : resizeState.startHeight,
      width: canResizeWidth
        ? clamp(
            resizeState.startWidth + deltaX,
            MIN_CHART_PANEL_WIDTH,
            maxWidth,
          )
        : resizeState.startWidth,
    });
  }

  function stopChartPanelResize() {
    chartPanelResizeStateRef.current = null;
  }

  function handleScroll() {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    setScrollPosition({
      top: scroller.scrollTop,
      left: scroller.scrollLeft,
    });
    setViewportSize({
      width: scroller.clientWidth,
      height: scroller.clientHeight,
    });
  }

  function startResize(
    event: PointerEvent<HTMLButtonElement>,
    resize: ResizeState,
  ) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizeState(resize);
  }

  function continueResize(event: PointerEvent<HTMLButtonElement>) {
    if (!resizeState) {
      return;
    }

    if (resizeState.type === 'col') {
      const delta = event.clientX - resizeState.startPointer;
      const nextWidth = clamp(
        resizeState.startSize + delta,
        MIN_COL_WIDTH,
        MAX_DRAG_COL_WIDTH,
      );

      setColWidths((current) =>
        current.map((width, index) =>
          index === resizeState.index ? nextWidth : width,
        ),
      );
    }

    if (resizeState.type === 'row') {
      const delta = event.clientY - resizeState.startPointer;
      const nextHeight = clamp(resizeState.startSize + delta, 44, 140);

      setRowHeights((current) =>
        current.map((height, index) =>
          index === resizeState.index ? nextHeight : height,
        ),
      );
    }
  }

  function stopResize() {
    setResizeState(null);
  }

  function measureColumnText(text: string, format?: CellFormat): number {
    measuringCanvasRef.current ??= document.createElement('canvas');

    const context = measuringCanvasRef.current.getContext('2d');

    if (!context) {
      return text.length * 11;
    }

    const fontStyle = format?.italic ? 'italic ' : '';
    const fontWeight = format?.bold ? '900' : '700';
    const fontSize = format?.fontSize ?? 20;

    context.font = `${fontStyle}${fontWeight} ${fontSize}px system-ui, sans-serif`;

    return context.measureText(text || ' ').width;
  }

  function autofitColumn(col: number) {
    const headerWidth = isPlainHeaders
      ? 0
      : measureColumnText(getColumnName(col), { bold: true, fontSize: 18 });
    const widestCell = sheet.reduce((widest, row) => {
      const cell = row[col];

      if (!cell) {
        return widest;
      }

      const width = measureColumnText(
        formatDisplayValue(cell.displayValue),
        cell.format,
      );

      return Math.max(widest, width);
    }, headerWidth);
    const nextWidth = clamp(
      Math.ceil(widestCell + CELL_TEXT_PADDING),
      MIN_COL_WIDTH,
      MAX_AUTOFIT_COL_WIDTH,
    );

    setColWidths((current) =>
      current.map((width, index) => (index === col ? nextWidth : width)),
    );
    setFileMessage(`Column ${getColumnName(col)} fit to data.`);
  }

  function updateFrozenPane(axis: FreezeDragAxis, event: PointerEvent) {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    const scrollerBounds = scroller.getBoundingClientRect();

    if (axis === 'col') {
      const pointerX =
        event.clientX - scrollerBounds.left + scroller.scrollLeft;

      setFrozenCols(
        clamp(
          countFrozenItems(colWidths, columnOffsets, pointerX),
          0,
          DEFAULT_COLS - 1,
        ),
      );
    }

    if (axis === 'row') {
      const pointerY = event.clientY - scrollerBounds.top + scroller.scrollTop;

      setFrozenRows(
        clamp(
          countFrozenItems(rowHeights, rowOffsets, pointerY),
          0,
          DEFAULT_ROWS - 1,
        ),
      );
    }
  }

  function startFreezeDrag(
    axis: FreezeDragAxis,
    event: PointerEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setFreezeDragAxis(axis);
    updateFrozenPane(axis, event);
  }

  function continueFreezeDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!freezeDragAxis) {
      return;
    }

    updateFrozenPane(freezeDragAxis, event);
  }

  function stopFreezeDrag() {
    if (freezeDragAxis === 'col') {
      setFileMessage(
        frozenCols === 0
          ? 'No columns frozen.'
          : `Frozen ${frozenCols} column${frozenCols === 1 ? '' : 's'}.`,
      );
    }

    if (freezeDragAxis === 'row') {
      setFileMessage(
        frozenRows === 0
          ? 'No rows frozen.'
          : `Frozen ${frozenRows} row${frozenRows === 1 ? '' : 's'}.`,
      );
    }

    setFreezeDragAxis(null);
  }

  function resetSheet() {
    if (!window.confirm(strings.startOverConfirm)) {
      return;
    }

    remember(sheet);
    setSheet(createSheet(DEFAULT_ROWS, DEFAULT_COLS));
    setSelection(createSelection({ row: 0, col: 0 }));
    setEditingCell(null);
    setChart(null);
    setIsChartPanelOpen(false);
    setFileMessage('Started over with a blank sheet.');
  }

  function formatDisplayValue(value: string): string {
    if (numberFormat === 'plain' || value.trim() === '') {
      return value;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return value;
    }

    if (numberFormat === 'whole') {
      return Math.round(numericValue).toLocaleString();
    }

    if (numberFormat === 'decimal') {
      return numericValue.toLocaleString(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      });
    }

    if (numberFormat === 'currency') {
      return numericValue.toLocaleString(undefined, {
        currency: 'USD',
        style: 'currency',
      });
    }

    return `${(numericValue * 100).toLocaleString(undefined, {
      maximumFractionDigits: 1,
    })}%`;
  }

  function getCellValueStyle(cellFormat: CellFormat | undefined): CSSProperties {
    return {
      color: cellFormat?.textColor,
      fontFamily: cellFormat?.fontFamily,
      fontSize: cellFormat?.fontSize,
      fontStyle: cellFormat?.italic ? 'italic' : undefined,
      fontWeight: cellFormat?.bold ? 900 : undefined,
      textAlign: cellFormat?.align,
      textDecoration:
        cellFormat?.underline && cellFormat.strikethrough
          ? 'underline line-through'
          : cellFormat?.underline
            ? 'underline'
            : cellFormat?.strikethrough
              ? 'line-through'
              : undefined,
      whiteSpace: cellFormat?.wrapText ? 'normal' : undefined,
    };
  }

  function getCellContainerStyle(
    cellFormat: CellFormat | undefined,
    top: number,
    left: number,
    width: number,
    height: number,
    backgroundColor: string | undefined,
  ): CSSProperties {
    const alignItems =
      cellFormat?.verticalAlign === 'top'
        ? 'flex-start'
        : cellFormat?.verticalAlign === 'bottom'
          ? 'flex-end'
          : undefined;

    return {
      top,
      left,
      width,
      height,
      alignItems,
      backgroundColor,
    };
  }

  function renderCell(
    row: number,
    col: number,
    top: number,
    left: number,
    width: number,
    height: number,
    options: {
      className?: string;
      includeGridSemantics?: boolean;
      keyPrefix?: string;
    } = {},
  ) {
    const address = { row, col };
    const cell = sheet[row][col];

    if (cell.hiddenBy) {
      return null;
    }

    const isEditing = editingCell?.row === row && editingCell.col === col;
    const isSelected = isCellInSelection(address, selection);
    const includeGridSemantics = options.includeGridSemantics ?? true;
    const colSpan = cell.merge?.colSpan ?? 1;
    const rowSpan = cell.merge?.rowSpan ?? 1;
    const renderedWidth =
      colSpan > 1
        ? colWidths
            .slice(col, Math.min(DEFAULT_COLS, col + colSpan))
            .reduce((sum, colWidth) => sum + colWidth, 0)
        : width;
    const renderedHeight =
      rowSpan > 1
        ? rowHeights
            .slice(row, Math.min(DEFAULT_ROWS, row + rowSpan))
            .reduce((sum, rowHeight) => sum + rowHeight, 0)
        : height;

    return (
      <div
        aria-colindex={includeGridSemantics ? col + 1 : undefined}
        aria-label={
          includeGridSemantics
            ? `Cell ${getColumnName(col)}${row + 1}`
            : undefined
        }
        className={
          [
            'sheet-cell',
            cell.format?.border ? 'formatted-border' : '',
            cell.merge ? 'merged-cell' : '',
            isSelected ? 'selected' : '',
            options.className ?? '',
          ]
            .filter(Boolean)
            .join(' ')
        }
        data-testid={
          includeGridSemantics ? `cell-${getColumnName(col)}${row + 1}` : undefined
        }
        key={`${options.keyPrefix ?? 'cell'}-${row}-${col}`}
        role={includeGridSemantics ? 'gridcell' : undefined}
        style={getCellContainerStyle(
          cell.format,
          top,
          left,
          renderedWidth,
          renderedHeight,
          cell.format?.backgroundColor,
        )}
        onDoubleClick={() => beginEditing(address)}
        onPointerDown={(event) => handleCellPointerDown(event, address)}
        onPointerEnter={() => handleCellPointerEnter(address)}
        onPointerUp={(event) => handleCellPointerUp(event, address)}
      >
        {isEditing ? (
          <input
            aria-label={`Edit cell ${getColumnName(col)}${row + 1}`}
            className="cell-editor"
            value={draftValue}
            autoFocus
            onBlur={() => commitEditing()}
            onChange={(event) => setDraftValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitEditing(true);
              }

              if (event.key === 'Escape') {
                event.preventDefault();
                cancelEditing();
              }
            }}
          />
        ) : (
          <span
            className={
              cell.errorType
                ? `cell-value ${cell.type} error`
                : `cell-value ${cell.type}`
            }
            style={getCellValueStyle(cell.format)}
          >
            {formatDisplayValue(cell.displayValue)}
          </span>
        )}
      </div>
    );
  }

  return (
    <section className="sheet-workspace" aria-label="Spreadsheet workspace">
      <div className="sheet-toolbar" aria-label="Sheet tools">
        <button
          className="big-action"
          aria-label="Undo"
          title="Undo"
          type="button"
          onClick={undo}
          disabled={history.length === 0}
        >
          ↶
        </button>
        <button
          className="big-action"
          aria-label="Redo"
          title="Redo"
          type="button"
          onClick={redo}
          disabled={future.length === 0}
        >
          ↷
        </button>
        <label className="format-control compact-select">
          <span className="visually-hidden">Font family</span>
          <select
            aria-label="Font family"
            value={selectedFormat.fontFamily ?? FONT_FAMILIES[0].value}
            onChange={(event) => setCellFontFamily(event.target.value)}
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </label>
        <div className="format-button-group" aria-label="Cell formatting">
          <button
            aria-label="Decrease font size"
            className="format-button"
            title="Decrease font size"
            type="button"
            onClick={() => setCellFontSize((selectedFormat.fontSize ?? 20) - 1)}
          >
            <Minus aria-hidden="true" size={16} />
          </button>
          <button
            aria-label="Borders"
            aria-pressed={Boolean(selectedFormat.border)}
            className="format-button"
            title="Borders"
            type="button"
            onClick={() => toggleBooleanFormat('border')}
          >
            <Square aria-hidden="true" size={18} />
          </button>
          <button
            aria-label="Bold"
            aria-pressed={Boolean(selectedFormat.bold)}
            className="format-button"
            title="Bold"
            type="button"
            onClick={() => toggleBooleanFormat('bold')}
          >
            B
          </button>
          <button
            aria-label="Italic"
            aria-pressed={Boolean(selectedFormat.italic)}
            className="format-button italic"
            title="Italic"
            type="button"
            onClick={() => toggleBooleanFormat('italic')}
          >
            I
          </button>
          <button
            aria-label="Underline"
            aria-pressed={Boolean(selectedFormat.underline)}
            className="format-button underline"
            title="Underline"
            type="button"
            onClick={() => toggleBooleanFormat('underline')}
          >
            U
          </button>
          <button
            aria-label="Strikethrough"
            aria-pressed={Boolean(selectedFormat.strikethrough)}
            className="format-button strike"
            title="Strikethrough"
            type="button"
            onClick={() => toggleBooleanFormat('strikethrough')}
          >
            S
          </button>
          <button
            aria-label="Wrap text"
            aria-pressed={Boolean(selectedFormat.wrapText)}
            className="format-button"
            title="Wrap text"
            type="button"
            onClick={() => toggleBooleanFormat('wrapText')}
          >
            <WrapText aria-hidden="true" size={18} />
          </button>
          <button
            aria-label="Merge cells"
            className="format-button"
            title="Merge cells"
            type="button"
            onClick={mergeSelectedCells}
          >
            <Merge aria-hidden="true" size={18} />
          </button>
          <button
            aria-label="Clear formatting"
            className="format-button"
            title="Clear formatting"
            type="button"
            onClick={clearSelectedFormatting}
          >
            <Eraser aria-hidden="true" size={18} />
          </button>
          <label className="font-size-control">
            <span className="visually-hidden">Font size</span>
            <input
              aria-label="Font size"
              min="8"
              max="32"
              type="number"
              value={selectedFormat.fontSize ?? 20}
              onChange={(event) =>
                setCellFontSize(Number(event.target.value) || 20)
              }
            />
          </label>
          <button
            aria-label="Increase font size"
            className="format-button"
            title="Increase font size"
            type="button"
            onClick={() => setCellFontSize((selectedFormat.fontSize ?? 20) + 1)}
          >
            <Plus aria-hidden="true" size={16} />
          </button>
        </div>
        <div className="format-button-group" aria-label="Cell alignment">
          {(['left', 'center', 'right'] as CellTextAlign[]).map((align) => (
            (() => {
              const Icon =
                align === 'left'
                  ? AlignLeft
                  : align === 'center'
                    ? AlignCenter
                    : AlignRight;

              return (
                <button
                  aria-label={`Align ${align}`}
                  aria-pressed={selectedFormat.align === align}
                  className="format-button"
                  key={align}
                  title={`Align ${align}`}
                  type="button"
                  onClick={() => setAlignment(align)}
                >
                  <Icon aria-hidden="true" size={18} />
                </button>
              );
            })()
          ))}
          {(['top', 'middle', 'bottom'] as CellVerticalAlign[]).map(
            (verticalAlign) => {
              const Icon =
                verticalAlign === 'top'
                  ? AlignVerticalJustifyStart
                  : verticalAlign === 'middle'
                    ? AlignVerticalJustifyCenter
                    : AlignVerticalJustifyEnd;

              return (
                <button
                  aria-label={`Align ${verticalAlign}`}
                  aria-pressed={selectedFormat.verticalAlign === verticalAlign}
                  className="format-button"
                  key={verticalAlign}
                  title={`Align ${verticalAlign}`}
                  type="button"
                  onClick={() => setVerticalAlignment(verticalAlign)}
                >
                  <Icon aria-hidden="true" size={18} />
                </button>
              );
            },
          )}
        </div>
        <div className="format-button-group" aria-label="Sheet operations">
          <button
            aria-label="AutoSum"
            className="format-button"
            title="AutoSum"
            type="button"
            onClick={autoSumSelection}
          >
            <Sigma aria-hidden="true" size={18} />
          </button>
          <button
            aria-label="Sort A to Z"
            className="format-button"
            title="Sort A to Z"
            type="button"
            onClick={() => sortSelectedRows('ascending')}
          >
            <ArrowDownAZ aria-hidden="true" size={18} />
          </button>
          <button
            aria-label="Sort Z to A"
            className="format-button"
            title="Sort Z to A"
            type="button"
            onClick={() => sortSelectedRows('descending')}
          >
            <ArrowDownZA aria-hidden="true" size={18} />
          </button>
          <button
            aria-label="Currency format"
            aria-pressed={numberFormat === 'currency'}
            className="format-button"
            title="Currency format"
            type="button"
            onClick={() => setNumberFormat('currency')}
          >
            <DollarSign aria-hidden="true" size={18} />
          </button>
          <button
            aria-label="Percent format"
            aria-pressed={numberFormat === 'percent'}
            className="format-button"
            title="Percent format"
            type="button"
            onClick={() => setNumberFormat('percent')}
          >
            <Percent aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="format-button-group" aria-label="View zoom">
          <button
            aria-label="Zoom out"
            className="format-button"
            title="Zoom out"
            type="button"
            onClick={() => setZoom(sheetZoom - 10)}
          >
            <Minus aria-hidden="true" size={16} />
          </button>
          <button
            aria-label="Reset zoom to 100%"
            className="zoom-reset-button"
            title="Reset zoom to 100%"
            type="button"
            onClick={() => setZoom(100)}
          >
            {sheetZoom}%
          </button>
          <button
            aria-label="Zoom in"
            className="format-button"
            title="Zoom in"
            type="button"
            onClick={() => setZoom(sheetZoom + 10)}
          >
            <Plus aria-hidden="true" size={16} />
          </button>
        </div>
        <label className="color-control">
          <Type aria-hidden="true" size={18} />
          <span className="visually-hidden">Text color</span>
          <input
            aria-label="Text color"
            type="color"
            value={selectedFormat.textColor ?? '#1f2937'}
            onChange={(event) => setCellTextColor(event.target.value)}
          />
        </label>
        <label className="color-control">
          <PaintBucket aria-hidden="true" size={18} />
          <span className="visually-hidden">Fill color</span>
          <input
            aria-label="Fill color"
            type="color"
            value={selectedFormat.backgroundColor ?? '#ffffff'}
            onChange={(event) => setCellFillColor(event.target.value)}
          />
        </label>
        <input
          ref={fileInputRef}
          aria-label="Import spreadsheet file"
          className="visually-hidden"
          type="file"
          accept=".csv,.json,.gridsplat.json,.md,.markdown,.xlsx,text/csv,application/json,text/markdown,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={importFile}
        />
        <label className="header-toggle">
          <input
            type="checkbox"
            checked={isPlainHeaders}
            onChange={(event) => setIsPlainHeaders(event.target.checked)}
          />
          Hide headers
        </label>
        <label className="format-control">
          Number format
          <select
            value={numberFormat}
            onChange={(event) =>
              setNumberFormat(event.target.value as NumberFormat)
            }
          >
            <option value="plain">Plain</option>
            <option value="whole">Whole numbers</option>
            <option value="decimal">Decimals</option>
            <option value="currency">Currency</option>
            <option value="percent">Percent</option>
          </select>
        </label>
        <p aria-live="polite" className="file-message">
          {fileMessage}
        </p>
      </div>
      <div
        ref={scrollerRef}
        className="sheet-scroller"
        onScroll={handleScroll}
      >
        <div
          className="sheet-canvas"
          style={
            {
              width: totalWidth,
              height: totalHeight,
              zoom: `${sheetZoom}%`,
            } as CSSProperties & { zoom: string }
          }
        >
          <div
            className="corner-header"
            style={{ width: HEADER_SIZE, height: HEADER_SIZE }}
          >
            <span aria-live="polite">
              {getColumnName(selection.end.col)}
              {selection.end.row + 1}
            </span>
          </div>
          {visibleCols.map(({ col, left, width }) => (
            <div
              className="column-header"
              key={col}
              style={{
                left,
                width,
                height: HEADER_SIZE,
              }}
            >
              {isPlainHeaders ? '' : getColumnName(col)}
              <button
                aria-label={`Resize column ${getColumnName(col)}`}
                className="resize-handle resize-handle-col"
                type="button"
                onDoubleClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  autofitColumn(col);
                }}
                onPointerDown={(event) =>
                  startResize(event, {
                    type: 'col',
                    index: col,
                    startPointer: event.clientX,
                    startSize: width,
                  })
                }
                onPointerMove={continueResize}
                onPointerUp={stopResize}
              />
            </div>
          ))}
          {visibleRows.map(({ row, top, height }) => (
            <div
              className="row-header"
              key={row}
              style={{
                top,
                width: HEADER_SIZE,
                height,
              }}
            >
              {isPlainHeaders ? '' : row + 1}
              <button
                aria-label={`Resize row ${row + 1}`}
                className="resize-handle resize-handle-row"
                type="button"
                onPointerDown={(event) =>
                  startResize(event, {
                    type: 'row',
                    index: row,
                    startPointer: event.clientY,
                    startSize: height,
                  })
                }
                onPointerMove={continueResize}
                onPointerUp={stopResize}
              />
            </div>
          ))}
          <div
            aria-colcount={DEFAULT_COLS}
            aria-label="GridSplat™ grid"
            aria-rowcount={DEFAULT_ROWS}
            className="sheet-grid-layer"
            role="grid"
            tabIndex={0}
            onCopy={handleCopy}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          >
            {visibleRows.map(({ row, top, height }) => (
              <div
                aria-rowindex={row + 1}
                className="sheet-row"
                key={row}
                role="row"
                style={{
                  top,
                  width: totalWidth,
                  height,
                }}
              >
                {visibleCols.map(({ col, left, width }) =>
                  renderCell(row, col, 0, left, width, height),
                )}
              </div>
            ))}
          </div>
          {frozenRows > 0 ? (
            <div className="frozen-pane-layer frozen-row-layer">
              {frozenRowsList.flatMap(({ row, top, height }) =>
                visibleCols
                  .filter(({ col }) => col >= frozenCols)
                  .map(({ col, left, width }) =>
                    renderCell(
                      row,
                      col,
                      scrollPosition.top + top,
                      left,
                      width,
                      height,
                      {
                        className: 'frozen-cell frozen-row-cell',
                        includeGridSemantics: false,
                        keyPrefix: 'frozen-row',
                      },
                    ),
                  ),
              )}
            </div>
          ) : null}
          {frozenCols > 0 ? (
            <div className="frozen-pane-layer frozen-col-layer">
              {visibleRows
                .filter(({ row }) => row >= frozenRows)
                .flatMap(({ row, top, height }) =>
                  frozenColsList.map(({ col, left, width }) =>
                    renderCell(
                      row,
                      col,
                      top,
                      scrollPosition.left + left,
                      width,
                      height,
                      {
                        className: 'frozen-cell frozen-col-cell',
                        includeGridSemantics: false,
                        keyPrefix: 'frozen-col',
                      },
                    ),
                  ),
                )}
            </div>
          ) : null}
          {frozenRows > 0 && frozenCols > 0 ? (
            <div className="frozen-pane-layer frozen-corner-layer">
              {frozenRowsList.flatMap(({ row, top, height }) =>
                frozenColsList.map(({ col, left, width }) =>
                  renderCell(
                    row,
                    col,
                    scrollPosition.top + top,
                    scrollPosition.left + left,
                    width,
                    height,
                    {
                      className: 'frozen-cell frozen-corner-cell',
                      includeGridSemantics: false,
                      keyPrefix: 'frozen-corner',
                    },
                  ),
                ),
              )}
            </div>
          ) : null}
          <button
            aria-label="Drag vertical freeze divider"
            className="freeze-divider freeze-divider-col"
            title="Drag to freeze columns"
            type="button"
            style={{
              top: scrollPosition.top,
              left: scrollPosition.left + freezeColBoundary,
              height: viewportSize.height,
            }}
            onPointerCancel={stopFreezeDrag}
            onPointerDown={(event) => startFreezeDrag('col', event)}
            onPointerMove={continueFreezeDrag}
            onPointerUp={stopFreezeDrag}
          />
          <button
            aria-label="Drag horizontal freeze divider"
            className="freeze-divider freeze-divider-row"
            title="Drag to freeze rows"
            type="button"
            style={{
              top: scrollPosition.top + freezeRowBoundary,
              left: scrollPosition.left,
              width: viewportSize.width,
            }}
            onPointerCancel={stopFreezeDrag}
            onPointerDown={(event) => startFreezeDrag('row', event)}
            onPointerMove={continueFreezeDrag}
            onPointerUp={stopFreezeDrag}
          />
        </div>
      </div>
      {activeChart && isChartPanelOpen ? (
        <section
          ref={chartPanelRef}
          className="chart-panel chart-floating-panel"
          data-positioned={chartPanelPosition ? 'true' : undefined}
          data-sized={chartPanelSize ? 'true' : undefined}
          aria-label="Chart preview"
          style={
            {
              ...(chartPanelPosition
                ? {
                    left: chartPanelPosition.left,
                    top: chartPanelPosition.top,
                  }
                : {}),
              ...(chartPanelSize
                ? {
                    height: chartPanelSize.height,
                    width: chartPanelSize.width,
                  }
                : {}),
            } satisfies CSSProperties
          }
        >
          <div className="chart-drag-bar">
            <button
              aria-label="Move chart"
              className="chart-drag-handle"
              title="Drag to move chart"
              type="button"
              onPointerCancel={stopChartPanelDrag}
              onPointerDown={startChartPanelDrag}
              onPointerMove={continueChartPanelDrag}
              onPointerUp={stopChartPanelDrag}
            >
              <span aria-hidden="true" className="chart-grip" />
              Move chart
            </button>
            <button
              className="chart-copy-button"
              type="button"
              onClick={copyChartPng}
            >
              Copy chart
            </button>
          </div>
          <div className="chart-panel-header">
            <label className="chart-title-field">
              Chart title
              <input
                value={activeChart.title}
                onChange={(event) => updateChartTitle(event.target.value)}
              />
            </label>
            <button
              className="format-button"
              type="button"
              aria-label="Close chart"
              onClick={() => setIsChartPanelOpen(false)}
            >
              x
            </button>
          </div>
          <div
            className="chart-canvas-wrap"
            style={
              chartPanelSize
                ? {
                    height: Math.max(160, chartPanelSize.height - 280),
                    minHeight: 160,
                  }
                : undefined
            }
          >
            <ChartCanvas
              chart={activeChart}
              onPointAdjustStart={startChartValueAdjust}
              onPointValueChange={updateChartPointValue}
            />
          </div>
          <table className="chart-summary">
            <caption>{activeChart.title} data</caption>
            <tbody>
              {activeChart.points.map((point, index) => (
                <tr key={`${point.label}-${index}`}>
                  <th scope="row">{point.label}</th>
                  <td>{point.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {[
            {
              className: 'chart-resize-handle-right',
              handle: 'right' as ChartResizeHandle,
              label: 'Resize chart width',
            },
            {
              className: 'chart-resize-handle-bottom',
              handle: 'bottom' as ChartResizeHandle,
              label: 'Resize chart height',
            },
            {
              className: 'chart-resize-handle-corner',
              handle: 'corner' as ChartResizeHandle,
              label: 'Resize chart',
            },
          ].map((resizeHandle) => (
            <button
              aria-label={resizeHandle.label}
              className={`chart-resize-handle ${resizeHandle.className}`}
              key={resizeHandle.handle}
              title={resizeHandle.label}
              type="button"
              onPointerCancel={stopChartPanelResize}
              onPointerDown={(event) =>
                startChartPanelResize(resizeHandle.handle, event)
              }
              onPointerMove={continueChartPanelResize}
              onPointerUp={stopChartPanelResize}
            />
          ))}
        </section>
      ) : null}
    </section>
  );
}
