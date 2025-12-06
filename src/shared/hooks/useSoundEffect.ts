import { useCallback } from 'react';
import { useSound } from '../contexts/SoundContext';
import { 
  playHoverSound, 
  playClickSound, 
  playAccessGrantedSound, 
  playErrorSound 
} from '../utils/soundEffects';

export const useSoundEffect = () => {
  const { soundEnabled } = useSound();

  const playHover = useCallback(() => {
    if (soundEnabled) {
      playHoverSound();
    }
  }, [soundEnabled]);

  const playClick = useCallback(() => {
    if (soundEnabled) {
      playClickSound();
    }
  }, [soundEnabled]);

  const playSuccess = useCallback(() => {
    if (soundEnabled) {
      playAccessGrantedSound();
    }
  }, [soundEnabled]);

  const playError = useCallback(() => {
    if (soundEnabled) {
      playErrorSound();
    }
  }, [soundEnabled]);

  return {
    playHover,
    playClick,
    playSuccess,
    playError,
    soundEnabled,
  };
};
