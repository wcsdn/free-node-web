import { useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { 
  playHoverSound, 
  playClickSound, 
  playAccessGrantedSound, 
  playErrorSound 
} from '../utils/soundEffects';

export const useSoundEffect = () => {
  const soundEnabled = useAppStore((state) => state.soundEnabled);

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
