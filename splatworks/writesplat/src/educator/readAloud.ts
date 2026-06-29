export interface ReadAloudOptions {
  onBoundary?: (charIndex: number, charLength: number) => void;
  onEnd?: () => void;
  rate: number;
}

export function readTextAloud(text: string, options: ReadAloudOptions): boolean {
  if (!('speechSynthesis' in window) || !text.trim()) {
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate;
  utterance.onboundary = (event) => {
    if (typeof event.charIndex !== 'number') {
      return;
    }

    const charLength = typeof event.charLength === 'number' && event.charLength > 0 ? event.charLength : wordLengthAt(text, event.charIndex);
    options.onBoundary?.(event.charIndex, charLength);
  };
  utterance.onend = () => {
    options.onEnd?.();
  };
  window.speechSynthesis.speak(utterance);
  return true;
}

export function pauseReadAloud(): boolean {
  if (!('speechSynthesis' in window)) {
    return false;
  }

  window.speechSynthesis.pause();
  return true;
}

export function stopReadAloud(): boolean {
  if (!('speechSynthesis' in window)) {
    return false;
  }

  window.speechSynthesis.cancel();
  return true;
}

function wordLengthAt(text: string, charIndex: number): number {
  const fragment = text.slice(Math.max(0, charIndex));
  const match = /^\S+/u.exec(fragment);
  return match?.[0].length ?? 1;
}
