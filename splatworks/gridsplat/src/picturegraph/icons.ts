export interface PictureIcon {
  id: string;
  label: string;
  svg: string;
}

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const pictureIcons: PictureIcon[] = [
  {
    id: 'apple',
    label: 'Apple',
    svg: svgDataUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#15803d" d="M33 14c4-8 10-9 16-8-1 8-7 12-15 12z"/><path fill="#7c2d12" d="M29 18c0-7 2-11 5-15l5 3c-3 3-5 7-5 13z"/><path fill="#ef4444" d="M31 18c-9-8-24 0-22 17 2 17 13 26 23 18 10 8 21-1 23-18 2-17-13-25-24-17z"/><path fill="#fca5a5" d="M18 28c2-5 7-7 12-5-5 2-8 5-9 10z"/></svg>',
    ),
  },
  {
    id: 'banana',
    label: 'Banana',
    svg: svgDataUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#78350f" d="m12 42 6 6-5 6-6-5zM49 8l6 4-3 7-7-4z"/><path fill="#facc15" d="M12 42C30 47 47 32 49 12c-9 20-23 30-37 30z"/><path fill="#fde68a" d="M18 44c16-1 29-14 33-29-2 23-20 39-38 35z"/></svg>',
    ),
  },
  {
    id: 'orange',
    label: 'Orange',
    svg: svgDataUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="34" r="23" fill="#f97316"/><path fill="#15803d" d="M32 13c5-7 11-8 18-6-2 7-8 10-17 10z"/><path fill="#fed7aa" d="M20 27c3-6 9-9 16-8-7 2-12 6-14 13z"/></svg>',
    ),
  },
  {
    id: 'star',
    label: 'Star',
    svg: svgDataUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#f59e0b" d="m32 5 8 18 19 2-14 13 4 19-17-10-17 10 4-19L5 25l19-2z"/><path fill="#fde68a" d="m32 13 5 13 14 1-11 9 3 13-11-7-11 7 3-13-11-9 14-1z"/></svg>',
    ),
  },
];

export function findPictureIcon(id: string): PictureIcon {
  return pictureIcons.find((icon) => icon.id === id) ?? pictureIcons[0];
}
