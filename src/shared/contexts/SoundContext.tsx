import React, { createContext, useContext, useState, useEffect } from 'react';
import { AmbientSound } from '../utils/soundEffects';

interface SoundContextType {
  soundEnabled: boolean;
  ambientEnabled: boolean;
  toggleSound: () => void;
  toggleAmbient: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const ambientSound = new AmbientSound();

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [ambientEnabled, setAmbientEnabled] = useState(() => {
    const saved = localStorage.getItem('ambient_enabled');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sound_enabled', soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('ambient_enabled', ambientEnabled.toString());
    if (ambientEnabled && soundEnabled) {
      ambientSound.start(0.2); // 提高音量到 0.2
    } else {
      ambientSound.stop();
    }
  }, [ambientEnabled, soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  const toggleAmbient = () => {
    setAmbientEnabled(prev => !prev);
  };

  return (
    <SoundContext.Provider value={{ soundEnabled, ambientEnabled, toggleSound, toggleAmbient }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within SoundProvider');
  }
  return context;
};
