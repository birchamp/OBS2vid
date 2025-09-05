import { audioBasename, audioRelativePath } from '../../lib/paths';

describe('audio path mapping', () => {
  it('builds deterministic filenames', () => {
    expect(audioBasename(1,1)).toBe('obs-en-01-01.m4a');
    expect(audioBasename(32,3)).toBe('obs-en-32-03.m4a');
    expect(audioRelativePath(50, 12)).toBe('recordings/obs-en-50-12.m4a');
  });
});

