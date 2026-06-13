import {
  type ClipboardEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ChartCanvas } from '../charts/ChartCanvas';
import {
  buildFirstDataRangeChart,
  buildChartData,
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
  createSheet,
  getColumnName,
  isCellInSelection,
  parsePastedText,
  pasteCells,
  serializeSelection,
  updateCell,
} from './gridModel';
import type { CellAddress, SelectionRange, SheetData } from './types';

const DEFAULT_ROWS = 20;
const DEFAULT_COLS = 20;
const DEFAULT_ROW_HEIGHT = 56;
const DEFAULT_COL_WIDTH = 120;
const HEADER_SIZE = 48;
const OVERSCAN = 4;

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

export function SpreadsheetGrid({ onSheetUpdated }: SpreadsheetGridProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [scrollPosition, setScrollPosition] = useState({ top: 0, left: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 900, height: 620 });
  const [fileMessage, setFileMessage] = useState('');
  const [chart, setChart] = useState<ChartDataModel | null>(null);
  const [numberFormat, setNumberFormat] = useState<NumberFormat>('plain');
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

  function handleCellPointerDown(address: CellAddress) {
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

  function handleCellPointerUp(address: CellAddress) {
    if (
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
      nextSelection = {
        start: { row: 1, col: 0 },
        end: { row: Math.max(1, nextChart.points.length), col: 1 },
      };
    }

    if (nextChart.points.length === 0) {
      setFileMessage('Select labels and numbers before making a chart.');
      return;
    }

    setChart(nextChart);
    setChartSelection(nextSelection);
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
      const nextWidth = clamp(resizeState.startSize + delta, 72, 240);

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

  function resetSheet() {
    if (!window.confirm(strings.startOverConfirm)) {
      return;
    }

    remember(sheet);
    setSheet(createSheet(DEFAULT_ROWS, DEFAULT_COLS));
    setSelection(createSelection({ row: 0, col: 0 }));
    setEditingCell(null);
    setChart(null);
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

  return (
    <section className="sheet-workspace" aria-label="Spreadsheet workspace">
      <div className="sheet-toolbar" aria-label="Sheet tools">
        <button
          className="big-action"
          type="button"
          onClick={undo}
          disabled={history.length === 0}
        >
          Undo
        </button>
        <button
          className="big-action"
          type="button"
          onClick={redo}
          disabled={future.length === 0}
        >
          Redo
        </button>
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
          Plain headers
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
        <p aria-live="polite" className="selection-readout">
          Cell {getColumnName(selection.end.col)}
          {selection.end.row + 1}
        </p>
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
          style={{ width: totalWidth, height: totalHeight }}
        >
          <div
            className="corner-header"
            style={{ width: HEADER_SIZE, height: HEADER_SIZE }}
          />
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
                {visibleCols.map(({ col, left, width }) => {
                  const address = { row, col };
                  const cell = sheet[row][col];
                  const isEditing =
                    editingCell?.row === row && editingCell.col === col;
                  const isSelected = isCellInSelection(address, selection);

                  return (
                    <div
                      aria-colindex={col + 1}
                      aria-label={`Cell ${getColumnName(col)}${row + 1}`}
                      className={
                        isSelected ? 'sheet-cell selected' : 'sheet-cell'
                      }
                      data-testid={`cell-${getColumnName(col)}${row + 1}`}
                      key={`${row}-${col}`}
                      role="gridcell"
                      style={{
                        top: 0,
                        left,
                        width,
                        height,
                      }}
                      onDoubleClick={() => beginEditing(address)}
                      onPointerDown={() => handleCellPointerDown(address)}
                      onPointerEnter={() => handleCellPointerEnter(address)}
                      onPointerUp={() => handleCellPointerUp(address)}
                    >
                      {isEditing ? (
                        <input
                          aria-label={`Edit cell ${getColumnName(col)}${row + 1}`}
                          className="cell-editor"
                          value={draftValue}
                          autoFocus
                          onBlur={() => commitEditing()}
                          onChange={(event) =>
                            setDraftValue(event.target.value)
                          }
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
                        >
                          {formatDisplayValue(cell.displayValue)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      {chart ? (
        <section className="chart-panel" aria-label="Chart preview">
          <div className="chart-canvas-wrap">
            <ChartCanvas
              chart={buildChartData(
                sheet,
                chartSelection ?? selection,
                chart.type,
                chart.title,
              )}
            />
          </div>
          <table className="chart-summary">
            <caption>{chart.title} data</caption>
            <tbody>
              {buildChartData(
                sheet,
                chartSelection ?? selection,
                chart.type,
                chart.title,
              ).points.map((point) => (
                <tr key={point.label}>
                  <th scope="row">{point.label}</th>
                  <td>{point.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </section>
  );
}
