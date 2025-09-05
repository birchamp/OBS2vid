import { obsCdnImage } from '../../lib/obsImage';

describe('obsCdnImage', () => {
  it('builds canonical CDN URL', () => {
    expect(obsCdnImage(32, 3, '360px')).toBe('https://cdn.door43.org/obs/jpg/360px/obs-en-32-03.jpg');
    expect(obsCdnImage(1, 1, '2160px')).toBe('https://cdn.door43.org/obs/jpg/2160px/obs-en-01-01.jpg');
  });
});

