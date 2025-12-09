/**
 * 环境音管理 Hook
 */
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { AmbientSound } from '@/shared/utils/soundEffects';

export const useAmbientSound = () => {
  const ambientEnabled = useAppStore((state) => state.ambientEnabled);
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const ambientSoundRef = useRef<AmbientSound | null>(null);

  useEffect(() => {
    if (!ambientSoundRef.current) {
      ambientSoundRef.current = new AmbientSound();
    }

    if (ambientEnabled && soundEnabled) {
      ambientSoundRef.current.start(0.2);
    } else {
      ambientSoundRef.current.stop();
    }

    return () => {
      if (ambientSoundRef.current) {
        ambientSoundRef.current.stop();
      }
    };
  }, [ambientEnabled, soundEnabled]);

  return { ambientEnabled, soundEnabled };
};
