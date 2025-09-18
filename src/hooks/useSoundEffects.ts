import { useCallback } from 'react';

export interface SoundEffects {
  letterReveal: () => void;
  phraseComplete: () => void;
  gameStart: () => void;
  buttonHover: () => void;
  buttonClick: () => void;
  coinSound: () => void;
  fanfare: () => void;
  goldVowelReveal: () => void;
  consonantReveal: () => void;
  winnerCelebration: () => void;
}

export const useSoundEffects = (): SoundEffects => {
  // Create audio contexts for different sound effects
  const createBeep = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Audio not supported:', error);
    }
  }, []);

  const createChord = useCallback((frequencies: number[], duration: number) => {
    frequencies.forEach((freq, index) => {
      setTimeout(() => createBeep(freq, duration, 'triangle'), index * 50);
    });
  }, [createBeep]);

  const letterReveal = useCallback(() => {
    // Casino-style reveal sound - ascending note with sparkle
    createBeep(523, 0.2); // C5
    setTimeout(() => createBeep(659, 0.2), 100); // E5
    setTimeout(() => createBeep(784, 0.3), 200); // G5
  }, [createBeep]);

  const phraseComplete = useCallback(() => {
    // Victory fanfare - major chord progression
    const victoryChord1 = [523, 659, 784]; // C major
    const victoryChord2 = [587, 740, 880]; // D major
    const victoryChord3 = [659, 831, 988]; // E major
    
    createChord(victoryChord1, 0.4);
    setTimeout(() => createChord(victoryChord2, 0.4), 300);
    setTimeout(() => createChord(victoryChord3, 0.6), 600);
  }, [createChord]);

  const gameStart = useCallback(() => {
    // Exciting game start sound
    const startSequence = [392, 523, 659, 784]; // G4, C5, E5, G5
    startSequence.forEach((freq, index) => {
      setTimeout(() => createBeep(freq, 0.3, 'triangle'), index * 100);
    });
  }, [createBeep]);

  const buttonHover = useCallback(() => {
    createBeep(800, 0.1, 'triangle');
  }, [createBeep]);

  const buttonClick = useCallback(() => {
    createBeep(600, 0.15, 'square');
  }, [createBeep]);

  const coinSound = useCallback(() => {
    // Coin/token earning sound
    createBeep(1000, 0.1);
    setTimeout(() => createBeep(1200, 0.1), 80);
    setTimeout(() => createBeep(1400, 0.2), 160);
  }, [createBeep]);

  const fanfare = useCallback(() => {
    // Big celebration sound
    const fanfareNotes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    fanfareNotes.forEach((freq, index) => {
      setTimeout(() => {
        createBeep(freq, 0.4, 'triangle');
        setTimeout(() => createBeep(freq * 1.5, 0.2, 'sine'), 100);
      }, index * 200);
    });
  }, [createBeep]);

  const goldVowelReveal = useCallback(() => {
    // Golden shimmering sound for vowels - magical and precious
    createBeep(880, 0.3, 'sine'); // A5 - bright golden tone
    setTimeout(() => createBeep(1174, 0.25, 'triangle'), 150); // D6 - sparkle
    setTimeout(() => createBeep(1318, 0.2, 'sine'), 300); // E6 - shimmer
    setTimeout(() => createBeep(1760, 0.15, 'triangle'), 450); // A6 - final sparkle
  }, [createBeep]);

  const consonantReveal = useCallback(() => {
    // Strong, confident sound for consonants - solid and reliable
    createBeep(440, 0.25, 'square'); // A4 - strong foundation
    setTimeout(() => createBeep(523, 0.2, 'triangle'), 120); // C5 - confidence
    setTimeout(() => createBeep(659, 0.15, 'sine'), 240); // E5 - clarity
  }, [createBeep]);

  const winnerCelebration = useCallback(() => {
    // Epic victory celebration - triumphant and exciting
    // First part: Rising fanfare
    const risingNotes = [392, 440, 494, 523, 587, 659, 740, 831]; // G4 to G#5
    risingNotes.forEach((freq, index) => {
      setTimeout(() => createBeep(freq, 0.2, 'triangle'), index * 80);
    });

    // Second part: Victory chord burst
    setTimeout(() => {
      const victoryChord = [523, 659, 784, 1047]; // C major chord
      victoryChord.forEach(freq => {
        createBeep(freq, 0.8, 'triangle');
        setTimeout(() => createBeep(freq * 2, 0.4, 'sine'), 200); // Octave higher
      });
    }, 800);

    // Third part: Celebratory bells
    setTimeout(() => {
      const bells = [1047, 1175, 1319, 1568, 1760]; // High celebratory notes
      bells.forEach((freq, index) => {
        setTimeout(() => createBeep(freq, 0.3, 'sine'), index * 150);
      });
    }, 1400);
  }, [createBeep]);

  return {
    letterReveal,
    phraseComplete,
    gameStart,
    buttonHover,
    buttonClick,
    coinSound,
    fanfare,
    goldVowelReveal,
    consonantReveal,
    winnerCelebration
  };
};