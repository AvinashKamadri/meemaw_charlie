/**
 * Hook for playing sound effects
 * Manages audio playback for UI interactions
 */
export const useSoundEffects = () => {
  const soundMap: Record<'mic-on' | 'mic-off' | 'start' | 'session-end' | 'ui-switch' | 'speach-start' | 'speach-end', string> = {
    'mic-on': '/meemaw/audio/mic-on.mp3',
    'mic-off': '/meemaw/audio/mic-off.mp3',
    'start': '/meemaw/audio/start.mp3',
    'session-end': '/meemaw/audio/session-end.mp3',
    'ui-switch': '/meemaw/audio/ui-switch.mp3',
    'speach-start': '/meemaw/audio/speach-start.mp3',
    'speach-end': '/meemaw/audio/speach-end.mp3',
  };

  const playSound = (soundName: 'mic-on' | 'mic-off' | 'start' | 'session-end' | 'ui-switch' | 'speach-start' | 'speach-end') => {
    try {
      const soundPath = soundMap[soundName];
      if (!soundPath) {
        console.warn(`[SoundEffects] Unknown sound: ${soundName}`);
        return null;
      }
      const audio = new Audio(soundPath);
      audio.volume = 0.55; // Set volume to 55%
      audio.play().catch(err => {
        console.warn(`[SoundEffects] Failed to play ${soundName}:`, err);
      });
      return audio; // Return audio instance so it can be stopped later
    } catch (error) {
      console.warn(`[SoundEffects] Error playing sound ${soundName}:`, error);
      return null;
    }
  };

  return { playSound };
};
