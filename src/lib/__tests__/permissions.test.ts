import { ensureRecordPermission, startSectionRecording } from '../../lib/recorder';
import { ObsRecorder } from '../../native/ObsRecorder';

describe('permission gating', () => {
  it('returns false when denied', async () => {
    const hasSpy = jest.spyOn(ObsRecorder, 'hasPermission').mockResolvedValue(false);
    const reqSpy = jest.spyOn(ObsRecorder, 'requestPermission').mockResolvedValue(false);
    const ok = await ensureRecordPermission();
    expect(ok).toBe(false);
    hasSpy.mockRestore();
    reqSpy.mockRestore();
  });

  it('throws when starting without permission', async () => {
    jest.spyOn(ObsRecorder, 'hasPermission').mockResolvedValue(false);
    jest.spyOn(ObsRecorder, 'requestPermission').mockResolvedValue(false);
    await expect(startSectionRecording({ storyId: 1, index: 1 })).rejects.toThrow('Microphone permission denied');
  });
});

