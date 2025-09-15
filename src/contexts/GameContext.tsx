import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GameState, GamePhrase } from '../types/game';
import { createPhraseFromText, revealRandomVowel, revealRandomConsonant } from '../utils/gameUtils';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { crossTabSync } from '../utils/crossTabSync';

interface GameContextType {
  gameState: GameState;
  availablePhrases: Array<{ text: string; category: string; difficulty: 'easy' | 'medium' | 'hard' }>;
  startNewRound: (phraseIndex: number) => void;
  revealVowel: () => void;
  revealConsonant: () => void;
  handleLetterReveal: (position: number) => void;
  handlePhraseComplete: () => void;
  showCompletion: boolean;
  setShowCompletion: (show: boolean) => void;
  handleAnimationComplete: () => void;
  addCustomPhrase: (phrase: { text: string; category: string; difficulty: 'easy' | 'medium' | 'hard' }) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'tiktok-word-game-state';

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const sounds = useSoundEffects();
  
  // Load initial state using crossTabSync
  const loadGameState = (): GameState => {
    const saved = crossTabSync.loadState();
    
    // Validate the saved state - if it's test diagnostic data, ignore it
    if (saved && saved.diagnostic && saved.test) {
      console.log('⚠️ [CONTEXT] Ignoring test diagnostic data, using clean state');
      return {
        currentPhrase: null,
        isGameActive: false,
        roundNumber: 1,
        winners: [],
        tokensPerWinner: 100
      };
    }
    
    if (saved && saved.currentPhrase !== undefined && saved.isGameActive !== undefined) {
      console.log('✅ [CONTEXT] Loading valid state from storage:', saved);
      return saved;
    }
    
    console.log('🆕 [CONTEXT] Using fresh state');
    return {
      currentPhrase: null,
      isGameActive: false,
      roundNumber: 1,
      winners: [],
      tokensPerWinner: 100
    };
  };

  const [gameState, setGameState] = useState<GameState>(loadGameState);
  const [showCompletion, setShowCompletion] = useState(false);
  const [availablePhrases, setAvailablePhrases] = useState([
    { text: "INTELIGENCIA ARTIFICIAL", category: "Tecnología", difficulty: "hard" as const },
    { text: "PIZZA HAWAIANA", category: "Comida", difficulty: "medium" as const },
    { text: "TORRE EIFFEL", category: "Lugares", difficulty: "medium" as const },
    { text: "HOLA MUNDO", category: "Tecnología", difficulty: "easy" as const }
  ]);
  
  // Save state using crossTabSync
  const saveGameState = (newState: GameState) => {
    crossTabSync.saveState(newState);
  };
  
  // Listen for cross-tab updates
  useEffect(() => {
    console.log('🔧 [CONTEXT] Setting up cross-tab sync listener...');
    
    const unsubscribe = crossTabSync.subscribe((newState: GameState) => {
      console.log('🔄 [CONTEXT] Received cross-tab update:', newState);
      
      // Validate incoming state - only ignore explicit test data
      if (newState && newState.diagnostic && newState.test) {
        console.log('⚠️ [CONTEXT] Ignoring test diagnostic data');
        return;
      }
      
      // Accept valid game states (including those with currentPhrase)
      if (newState && (newState.currentPhrase !== undefined || newState.isGameActive !== undefined)) {
        console.log('✅ [CONTEXT] Applying state update:', newState);
        setGameState(newState);
      } else {
        console.log('❌ [CONTEXT] Rejecting invalid state update:', newState);
      }
    });
    
    // Test disabled - was corrupting state
    // setTimeout(() => {
    //   console.log('🧪 [CONTEXT] Running sync test...');
    //   crossTabSync.forceSyncTest();
    // }, 1000);
    
    return unsubscribe;
  }, []);

  const startNewRound = (phraseIndex: number = 0) => {
    console.log('%c🚨 [CONTEXT] ===== START NEW ROUND CALLED =====', 'color: red; font-size: 20px; font-weight: bold;');
    console.log('%c🎮 [CONTEXT] Starting new round with phrase index:', 'color: blue; font-size: 16px;', phraseIndex);
    alert('🚨 START NEW ROUND LLAMADO - Verifica la consola F12!');
    console.log('📝 [CONTEXT] Available phrases:', availablePhrases);
    console.log('📝 [CONTEXT] Current gameState before change:', gameState);
    
    const selectedPhrase = availablePhrases[phraseIndex];
    console.log('📝 [CONTEXT] Selected phrase:', selectedPhrase);
    
    if (!selectedPhrase) {
      console.error('❌ [CONTEXT] No phrase found at index:', phraseIndex);
      return;
    }
    
    const phrase = createPhraseFromText(
      `phrase-${Date.now()}`,
      selectedPhrase.text,
      selectedPhrase.category,
      selectedPhrase.difficulty
    );
    
    console.log('🎯 [CONTEXT] Created phrase object:', phrase);

    sounds.gameStart();
    
    // Create clean game state without diagnostic data
    const newState: GameState = {
      currentPhrase: phrase,
      isGameActive: true,
      winners: [],
      roundNumber: gameState.roundNumber || 1,
      tokensPerWinner: gameState.tokensPerWinner || 100
    };
    
    console.log('🔄 [CONTEXT] New clean game state:', newState);
    console.log('💾 [CONTEXT] FORCE SAVING to localStorage...');

    // Force save immediately
    saveGameState(newState);

    // Also force update local state
    setGameState(newState);

    // Enviar estado del juego al servidor TikTok Live
    sendGameStateToTikTokLive(phrase, selectedPhrase.text, selectedPhrase.category, true);
  };

  const sendGameStateToTikTokLive = async (phrase: GamePhrase, answer: string, category: string, isActive: boolean) => {
    console.log('🚨 [CONTEXT] ===== ENVIANDO ESTADO A TIKTOK LIVE =====');
    console.log('📡 [CONTEXT] Datos a enviar:', {
      phraseText: phrase.text,
      answer: answer,
      category: category,
      isActive: isActive
    });

    try {
      const payload = {
        phrase: phrase.text,
        answer: answer,
        category: category,
        isActive: isActive
      };

      console.log('📦 [CONTEXT] Payload JSON:', JSON.stringify(payload, null, 2));

      const response = await fetch('http://localhost:3002/tiktok-live-game-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('📨 [CONTEXT] Respuesta del servidor:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ [CONTEXT] Estado del juego enviado exitosamente:', responseData);
      } else {
        const errorText = await response.text();
        console.error('❌ [CONTEXT] Error enviando estado del juego:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ [CONTEXT] Error de red enviando estado del juego:', error);
    }

    console.log('🚨 [CONTEXT] ===== FIN ENVÍO ESTADO =====');
  };

  const handleLetterReveal = (position: number) => {
    console.log(`[CONTEXT] Letter revealed at position: ${position}`);
  };

  const handlePhraseComplete = () => {
    console.log('🎉 [CONTEXT] Phrase completed!');
    setShowCompletion(true);
    sounds.fanfare();
  };

  const handleAnimationComplete = () => {
    setShowCompletion(false);
    setGameState(prev => {
      const newState = {
        ...prev,
        isGameActive: false,
        roundNumber: prev.roundNumber + 1
      };
      saveGameState(newState);
      return newState;
    });
  };

  const revealVowel = () => {
    if (gameState.currentPhrase) {
      const updatedPhrase = revealRandomVowel(gameState.currentPhrase);
      setGameState(prev => {
        const newState = {
          ...prev,
          currentPhrase: updatedPhrase
        };
        saveGameState(newState);
        return newState;
      });
    }
  };

  const revealConsonant = () => {
    if (gameState.currentPhrase) {
      const updatedPhrase = revealRandomConsonant(gameState.currentPhrase);
      setGameState(prev => {
        const newState = {
          ...prev,
          currentPhrase: updatedPhrase
        };
        saveGameState(newState);
        return newState;
      });
    }
  };

  const addCustomPhrase = (phrase: { text: string; category: string; difficulty: 'easy' | 'medium' | 'hard' }) => {
    setAvailablePhrases(prev => [...prev, phrase]);
  };

  const value: GameContextType = {
    gameState,
    availablePhrases,
    startNewRound,
    revealVowel,
    revealConsonant,
    handleLetterReveal,
    handlePhraseComplete,
    showCompletion,
    setShowCompletion,
    handleAnimationComplete,
    addCustomPhrase
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};