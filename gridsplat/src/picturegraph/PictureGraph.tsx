import {
  DndContext,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { useState } from 'react';

import {
  addPicture,
  initialPictureCategories,
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
      <div className="picture-stack" aria-label={`${category.label} pictures`}>
        {Array.from({
          length: scaledPictureCount(category.count, scale),
        }).map((_, index) => (
          <span className="picture-symbol" key={`${category.id}-${index}`}>
            {category.icon}
          </span>
        ))}
      </div>
      <strong>{category.label}</strong>
      <span>{category.count} total</span>
    </div>
  );
}

export function PictureGraph() {
  const [categories, setCategories] = useState(initialPictureCategories);
  const [scale, setScale] = useState(1);
  const [message, setMessage] = useState('');

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

  function createFallbackPng() {
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

    categories.forEach((category, columnIndex) => {
      const centerX = padding + columnWidth * columnIndex + columnWidth / 2;
      const pictureCount = scaledPictureCount(category.count, scale);
      const symbolGap = chartHeight / Math.max(maxPictures, 1);

      ctx.textAlign = 'center';
      ctx.font = '34px sans-serif';

      Array.from({ length: pictureCount }).forEach((_, pictureIndex) => {
        ctx.fillText(
          category.icon,
          centerX,
          chartTop + chartHeight - pictureIndex * symbolGap,
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

  function handleDragEnd(event: DragEndEvent) {
    const targetId = event.over?.id;

    if (typeof targetId !== 'string') {
      return;
    }

    setCategories((current) => addPicture(current, targetId));
  }

  function exportPictureGraph() {
    setMessage('Downloaded gridsplat-picture-graph.png.');
    document.documentElement.dataset.pictureGraphExported = 'true';

    try {
      downloadPictureGraph(createFallbackPng());
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
                onChange={(event) =>
                  setCategories((current) =>
                    updateCategoryCount(
                      current,
                      category.id,
                      Number(event.target.value),
                    ),
                  )
                }
              />
            </label>
            <button
              aria-label={`Remove one ${category.label}`}
              className="picture-stepper"
              type="button"
              onClick={() =>
                setCategories((current) => removePicture(current, category.id))
              }
            >
              -
            </button>
            <button
              aria-label={`Add one ${category.label}`}
              className="picture-stepper"
              type="button"
              onClick={() =>
                setCategories((current) => addPicture(current, category.id))
              }
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
