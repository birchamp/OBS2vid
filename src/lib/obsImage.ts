const CDN_BASE = 'https://cdn.door43.org/obs/jpg';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export type ObsImageSize = '360px' | '2160px';

// Build canonical OBS CDN image URL for a given story/section and size.
export function obsCdnImage(storyId: number, sectionIndex: number, size: ObsImageSize): string {
  const sid = pad2(storyId);
  const idx = pad2(sectionIndex);
  return `${CDN_BASE}/${size}/obs-en-${sid}-${idx}.jpg`;
}

export const UI_IMAGE_SIZE: ObsImageSize = '360px';
export const EXPORT_IMAGE_SIZE: ObsImageSize = '2160px';

