import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  MonitorUp,
  Plus,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type SlideKind = 'sheet' | 'chart' | 'picture';

interface Slide {
  id: string;
  kind: SlideKind;
  title: string;
  body: string;
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

  const activeSlide = slides[activeIndex] ?? slides[0];

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
            className="big-action"
            type="button"
            onClick={() => setIsPresenting(true)}
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
            <div className="viewer-visual" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
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
