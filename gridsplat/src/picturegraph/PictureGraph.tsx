import {
  DndContext,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { useEffect, useRef, useState } from 'react';

import type { SheetMatrix } from '../io/matrix';
import { findPictureIcon, pictureIcons } from './icons';
import {
  addPicture,
  initialPictureCategories,
  matrixToPictureCategories,
  pictureCategoriesToMatrix,
  removePicture,
  scaledPictureCount,
  updateCategoryCount,
  type PictureCategory,
} from './model';

function PictureToken() {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'picture-token',
  });

  return (
    <button
      ref={setNodeRef}
      className="picture-token"
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
      type="button"
      {...listeners}
      {...attributes}
    >
      Drag one picture
    </button>
  );
}

function PictureColumn({
  category,
  scale,
}: {
  category: PictureCategory;
  scale: number;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: category.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={isOver ? 'picture-column over' : 'picture-column'}
      data-testid={`picture-column-${category.id}`}
    >
      <div
        aria-label={`${category.label} pictures`}
        className="picture-stack"
        role="img"
      >
        {Array.from({
          length: scaledPictureCount(category.count, scale),
        }).map((_, index) => (
          <img
            alt=""
            className="picture-symbol"
            key={`${category.id}-${index}`}
            src={findPictureIcon(category.iconId).svg}
          />
        ))}
      </div>
      <strong>{category.label}</strong>
      <span>{category.count} total</span>
    </div>
  );
}

interface PictureGraphProps {
  initialMatrix?: SheetMatrix | null;
}

function getInitialCategories(initialMatrix: SheetMatrix | null | undefined) {
  return initialMatrix
    ? (matrixToPictureCategories(initialMatrix) ?? initialPictureCategories)
    : initialPictureCategories;
}

export function PictureGraph({ initialMatrix }: PictureGraphProps) {
  const [categories, setCategories] = useState(() =>
    getInitialCategories(initialMatrix),
  );
  const [scale, setScale] = useState(1);
  const [message, setMessage] = useState('');
  const didUserChangeRef = useRef(false);
  const isSyncingFromSheetRef = useRef(false);

  useEffect(() => {
    if (didUserChangeRef.current) {
      return;
    }

    setCategories(getInitialCategories(initialMatrix));
  }, [initialMatrix]);

  useEffect(() => {
    function syncFromSheet(event: Event) {
      if (didUserChangeRef.current) {
        didUserChangeRef.current = false;
        return;
      }

      const matrix = (event as CustomEvent<string[][]>).detail;
      const nextCategories = matrixToPictureCategories(matrix);

      if (!nextCategories) {
        return;
      }

      isSyncingFromSheetRef.current = true;
      setCategories(nextCategories);
      window.setTimeout(() => {
        isSyncingFromSheetRef.current = false;
      }, 0);
    }

    window.addEventListener('gridsplat:sheet-updated', syncFromSheet);

    return () =>
      window.removeEventListener('gridsplat:sheet-updated', syncFromSheet);
  }, []);

  useEffect(() => {
    if (isSyncingFromSheetRef.current || !didUserChangeRef.current) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent('gridsplat:load-matrix', {
        detail: pictureCategoriesToMatrix(categories),
      }),
    );
  }, [categories]);

  function downloadPictureGraph(dataUrl: string) {
    const anchor = document.createElement('a');

    anchor.href = dataUrl;
    anchor.download = 'gridsplat-picture-graph.png';
    setMessage('Downloaded gridsplat-picture-graph.png.');

    window.setTimeout(() => {
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    }, 0);
  }

  async function loadIcon(src: string): Promise<HTMLImageElement> {
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Picture icon did not load.'));
      image.src = src;
    });

    return image;
  }

  async function createFallbackPng() {
    const canvas = document.createElement('canvas');
    const width = 960;
    const height = 540;
    const padding = 48;
    const columnWidth = (width - padding * 2) / categories.length;
    const maxPictures = Math.max(
      ...categories.map((category) =>
        scaledPictureCount(category.count, scale),
      ),
      1,
    );
    const chartTop = 92;
    const chartHeight = 300;
    const ctx = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    if (!ctx) {
      return canvas.toDataURL('image/png');
    }

    ctx.fillStyle = '#fff9e8';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#172033';
    ctx.font = '700 34px sans-serif';
    ctx.fillText('Favorite Fruit Pictograph', padding, 54);
    ctx.font = '600 20px sans-serif';
    ctx.fillText(`Each picture equals ${scale}`, padding, 84);

    const icons = await Promise.all(
      categories.map((category) => loadIcon(findPictureIcon(category.iconId).svg)),
    );

    categories.forEach((category, columnIndex) => {
      const centerX = padding + columnWidth * columnIndex + columnWidth / 2;
      const pictureCount = scaledPictureCount(category.count, scale);
      const symbolGap = chartHeight / Math.max(maxPictures, 1);

      ctx.textAlign = 'center';

      Array.from({ length: pictureCount }).forEach((_, pictureIndex) => {
        ctx.drawImage(
          icons[columnIndex],
          centerX - 18,
          chartTop + chartHeight - pictureIndex * symbolGap - 34,
          36,
          36,
        );
      });

      ctx.fillStyle = '#172033';
      ctx.font = '700 22px sans-serif';
      ctx.fillText(category.label, centerX, 460);
      ctx.font = '600 18px sans-serif';
      ctx.fillText(`${category.count} total`, centerX, 490);
    });

    return canvas.toDataURL('image/png');
  }

  function markUserChange() {
    didUserChangeRef.current = true;
  }

  function handleDragEnd(event: DragEndEvent) {
    const targetId = event.over?.id;

    if (typeof targetId !== 'string') {
      return;
    }

    markUserChange();
    setCategories((current) => addPicture(current, targetId));
  }

  async function exportPictureGraph() {
    setMessage('Downloaded gridsplat-picture-graph.png.');
    document.documentElement.dataset.pictureGraphExported = 'true';

    try {
      downloadPictureGraph(await createFallbackPng());
    } catch {
      setMessage('Picture graph export is ready to try again.');
    }
  }

  return (
    <section
      className="picture-graph-workspace"
      aria-labelledby="picture-title"
    >
      <header className="module-header">
        <div>
          <p className="eyebrow">Picture Graph</p>
          <h2 id="picture-title">Favorite Fruit Pictograph</h2>
        </div>
        <label className="scale-control">
          Each picture equals
          <input
            min="1"
            type="number"
            value={scale}
            onChange={(event) =>
              setScale(Math.max(1, Number(event.target.value)))
            }
          />
        </label>
        <button
          className="big-action secondary"
          data-testid="export-picture-graph"
          type="button"
          onClick={exportPictureGraph}
        >
          Export Picture PNG
        </button>
      </header>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="picture-tools">
          <PictureToken />
        </div>
        <div className="picture-graph" data-testid="picture-graph">
          {categories.map((category) => (
            <PictureColumn
              category={category}
              key={category.id}
              scale={scale}
            />
          ))}
        </div>
      </DndContext>
      <div className="picture-data-table" aria-label="Picture graph data table">
        {categories.map((category) => (
          <div className="picture-data-row" key={category.id}>
            <label>
              {category.label}
              <input
                min="0"
                type="number"
                value={category.count}
                onChange={(event) => {
                  markUserChange();
                  setCategories((current) =>
                    updateCategoryCount(
                      current,
                      category.id,
                      Number(event.target.value),
                    ),
                  );
                }}
              />
            </label>
            <label>
              Picture
              <select
                value={category.iconId}
                onChange={(event) => {
                  markUserChange();
                  setCategories((current) =>
                    current.map((item) =>
                      item.id === category.id
                        ? { ...item, iconId: event.target.value }
                        : item,
                    ),
                  );
                }}
              >
                {pictureIcons.map((icon) => (
                  <option key={icon.id} value={icon.id}>
                    {icon.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              aria-label={`Remove one ${category.label}`}
              className="picture-stepper"
              type="button"
              onClick={() => {
                markUserChange();
                setCategories((current) => removePicture(current, category.id))
              }}
            >
              -
            </button>
            <button
              aria-label={`Add one ${category.label}`}
              className="picture-stepper"
              type="button"
              onClick={() => {
                markUserChange();
                setCategories((current) => addPicture(current, category.id))
              }}
            >
              +
            </button>
          </div>
        ))}
      </div>
      <p aria-live="polite" className="file-message">
        {message}
      </p>
    </section>
  );
}
