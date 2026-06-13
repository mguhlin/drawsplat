import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  MonitorUp,
  Plus,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type SlideKind = 'sheet' | 'chart' | 'picture';

interface Slide {
  id: string;
  kind: SlideKind;
  title: string;
  body: string;
}

interface SlideSnapshot {
  imageUrl?: string;
  rows?: string[][];
  stats?: Array<{ label: string; value: string }>;
}

const slideLibrary: Record<SlideKind, Omit<Slide, 'id'>> = {
  sheet: {
    kind: 'sheet',
    title: 'Class Sheet',
    body: 'Show the spreadsheet grid so the class can inspect the data together.',
  },
  chart: {
    kind: 'chart',
    title: 'Chart View',
    body: 'Show a chart and talk through patterns, totals, and comparisons.',
  },
  picture: {
    kind: 'picture',
    title: 'Picture Graph',
    body: 'Show the pictograph with a clear scale key for visual counting.',
  },
};

const defaultSlides: Slide[] = [
  { ...slideLibrary.sheet, id: 'slide-sheet' },
  { ...slideLibrary.chart, id: 'slide-chart' },
  { ...slideLibrary.picture, id: 'slide-picture' },
];

export function PresentationMode() {
  const [slides, setSlides] = useState(defaultSlides);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isSpotlight, setIsSpotlight] = useState(false);
  const [snapshots, setSnapshots] = useState<Record<string, SlideSnapshot>>({});
  const viewerRef = useRef<HTMLElement>(null);

  const activeSlide = slides[activeIndex] ?? slides[0];
  const activeSnapshot = snapshots[activeSlide.id];

  useEffect(() => {
    if (!isPresenting) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsPresenting(false);
      }

      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        setActiveIndex((current) => Math.min(current + 1, slides.length - 1));
      }

      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        setActiveIndex((current) => Math.max(current - 1, 0));
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, slides.length]);

  function addSlide(kind: SlideKind) {
    const next = slideLibrary[kind];
    const nextSlide = {
      ...next,
      id: `${kind}-${slides.length + 1}`,
    };

    setSlides((current) => [...current, nextSlide]);
    setActiveIndex(slides.length);
  }

  function goNext() {
    setActiveIndex((current) => Math.min(current + 1, slides.length - 1));
  }

  function goBack() {
    setActiveIndex((current) => Math.max(current - 1, 0));
  }

  function moveSlide(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= slides.length) {
      return;
    }

    setSlides((current) => {
      const nextSlides = [...current];
      const [slide] = nextSlides.splice(index, 1);

      if (!slide) {
        return current;
      }

      nextSlides.splice(nextIndex, 0, slide);

      return nextSlides;
    });
    setActiveIndex(nextIndex);
  }

  function exportPrintablePresentation() {
    window.print();
  }

  function captureSnapshot(kind: SlideKind): SlideSnapshot {
    if (kind === 'chart') {
      const canvas = document.querySelector<HTMLCanvasElement>(
        '[data-testid="chart-canvas"]',
      );
      const stats = Array.from(
        document.querySelectorAll<HTMLTableRowElement>('.chart-summary tbody tr'),
      ).map((row) => ({
        label: row.querySelector('th')?.textContent?.trim() ?? '',
        value: row.querySelector('td')?.textContent?.trim() ?? '',
      }));

      return {
        imageUrl: canvas?.toDataURL('image/png'),
        stats,
      };
    }

    if (kind === 'picture') {
      const stats = Array.from(
        document.querySelectorAll<HTMLElement>('.picture-column'),
      ).map((column) => {
        const label = column.querySelector('strong')?.textContent?.trim() ?? '';
        const value =
          Array.from(column.querySelectorAll('span'))
            .map((item) => item.textContent?.trim() ?? '')
            .find((text) => text.endsWith('total')) ?? '';

        return { label, value };
      });

      return { stats };
    }

    const cells = Array.from(
      document.querySelectorAll<HTMLElement>('.sheet-cell .cell-value'),
    )
      .map((cell) => cell.textContent?.trim() ?? '')
      .slice(0, 24);
    const rows: string[][] = [];

    for (let index = 0; index < cells.length; index += 4) {
      rows.push(cells.slice(index, index + 4));
    }

    return { rows };
  }

  function refreshSnapshots() {
    setSnapshots(
      Object.fromEntries(
        slides.map((slide) => [slide.id, captureSnapshot(slide.kind)]),
      ),
    );
  }

  async function startPresentation() {
    refreshSnapshots();
    setIsPresenting(true);

    await viewerRef.current?.requestFullscreen?.();
  }

  async function exportActiveSlidePng() {
    const snapshot = captureSnapshot(activeSlide.kind);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 1280;
    canvas.height = 720;

    if (!ctx) {
      return;
    }

    ctx.fillStyle = activeSlide.kind === 'sheet' ? '#7c3aed' : '#4c1d95';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 34px sans-serif';
    ctx.fillText(`Slide ${activeIndex + 1}`, 72, 86);
    ctx.font = '800 68px sans-serif';
    ctx.fillText(activeSlide.title, 72, 165);
    ctx.font = '600 30px sans-serif';
    ctx.fillText(activeSlide.body, 72, 220, 1120);

    if (snapshot.imageUrl) {
      const image = new Image();

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Slide image did not load.'));
        image.src = snapshot.imageUrl ?? '';
      });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(120, 270, 1040, 320);
      ctx.drawImage(image, 140, 290, 1000, 280);
    }

    if (snapshot.rows) {
      ctx.font = '700 28px sans-serif';
      snapshot.rows.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const x = 72 + colIndex * 260;
          const y = 300 + rowIndex * 58;

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y - 34, 230, 46);
          ctx.fillText(cell || ' ', x + 16, y);
        });
      });
    }

    if (snapshot.stats) {
      ctx.font = '700 36px sans-serif';
      snapshot.stats.slice(0, 8).forEach((item, index) => {
        ctx.fillText(`${item.label}: ${item.value}`, 120, 310 + index * 48);
      });
    }

    const anchor = document.createElement('a');

    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `gridsplat-slide-${activeIndex + 1}.png`;
    anchor.click();
  }

  return (
    <section className="presentation-workspace" aria-labelledby="present-title">
      <header className="module-header">
        <div>
          <p className="eyebrow">Presentation Mode</p>
          <h2 id="present-title">Whiteboard Slides</h2>
        </div>
        <div className="presentation-actions">
          <button
            className="big-action secondary"
            type="button"
            onClick={() => setIsSpotlight((current) => !current)}
          >
            <Maximize2 aria-hidden="true" size={20} />
            Spotlight
          </button>
          <button
            className="big-action secondary"
            type="button"
            onClick={exportPrintablePresentation}
          >
            <Download aria-hidden="true" size={20} />
            Print Slides
          </button>
          <button
            className="big-action secondary"
            type="button"
            onClick={() => void exportActiveSlidePng()}
          >
            <Download aria-hidden="true" size={20} />
            Export PNG
          </button>
          <button
            className="big-action"
            type="button"
            onClick={() => void startPresentation()}
          >
            <MonitorUp aria-hidden="true" size={20} />
            Start Presentation
          </button>
        </div>
      </header>

      <div className="slide-builder" aria-label="Slide builder">
        <button
          className="big-action secondary"
          type="button"
          onClick={() => addSlide('sheet')}
        >
          <Plus aria-hidden="true" size={18} />
          Add Sheet Slide
        </button>
        <button
          className="big-action secondary"
          type="button"
          onClick={() => addSlide('chart')}
        >
          <Plus aria-hidden="true" size={18} />
          Add Chart Slide
        </button>
        <button
          className="big-action secondary"
          type="button"
          onClick={() => addSlide('picture')}
        >
          <Plus aria-hidden="true" size={18} />
          Add Picture Graph Slide
        </button>
      </div>

      <ol className="slide-list" aria-label="Presentation slides">
        {slides.map((slide, index) => (
          <li key={slide.id}>
            <article
              className={
                index === activeIndex ? 'slide-card active' : 'slide-card'
              }
            >
              <button
                aria-current={index === activeIndex ? 'step' : undefined}
                className="slide-select"
                type="button"
                onClick={() => setActiveIndex(index)}
              >
                <span>Slide {index + 1}</span>
                <strong>{slide.title}</strong>
                <small>{slide.body}</small>
              </button>
              <div className="slide-card-actions">
                <button
                  className="big-action secondary"
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveSlide(index, -1)}
                >
                  Move Up
                </button>
                <button
                  className="big-action secondary"
                  type="button"
                  disabled={index === slides.length - 1}
                  onClick={() => moveSlide(index, 1)}
                >
                  Move Down
                </button>
              </div>
            </article>
          </li>
        ))}
      </ol>

      {isPresenting ? (
        <section
          ref={viewerRef}
          aria-label="Presentation viewer"
          aria-modal="true"
          className="presentation-viewer"
          role="dialog"
        >
          <button
            aria-label="Previous slide"
            className="viewer-nav"
            type="button"
            onClick={goBack}
          >
            <ChevronLeft aria-hidden="true" size={34} />
          </button>
          <article
            className={`viewer-slide ${activeSlide.kind}${
              isSpotlight ? ' spotlight' : ''
            }`}
          >
            <p>Slide {activeIndex + 1}</p>
            <h2>{activeSlide.title}</h2>
            {activeSnapshot?.imageUrl ? (
              <img
                alt={`${activeSlide.title} snapshot`}
                className="viewer-snapshot-image"
                src={activeSnapshot.imageUrl}
              />
            ) : null}
            {activeSnapshot?.rows ? (
              <div className="viewer-sheet-snapshot" aria-label="Sheet snapshot">
                {activeSnapshot.rows.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <span key={`${rowIndex}-${colIndex}`}>{cell}</span>
                  )),
                )}
              </div>
            ) : null}
            {activeSnapshot?.stats ? (
              <dl className="viewer-stats">
                {activeSnapshot.stats.map((item) => (
                  <div key={`${item.label}-${item.value}`}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <strong>{activeSlide.body}</strong>
          </article>
          <button
            aria-label="Next slide"
            className="viewer-nav"
            type="button"
            onClick={goNext}
          >
            <ChevronRight aria-hidden="true" size={34} />
          </button>
          <button
            className="exit-presentation"
            type="button"
            onClick={() => setIsPresenting(false)}
          >
            Exit Presentation
          </button>
        </section>
      ) : null}
    </section>
  );
}
