import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GameState } from '../types/game';
import { createPhraseFromText, revealRandomVowel, revealRandomConsonant, normalizeForComparison } from '../utils/gameUtils';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { simpleSync } from '../utils/simpleSync';
import { tiktokBotService } from '../services/tiktokBotService';
import { winnerService, WinnerData } from '../services/winnerService';
import { tiktokLiveService } from '../services/tiktokLiveService';

interface SimpleGameContextType {
  gameState: GameState;
  availablePhrases: Array<{ text: string; category: string; difficulty: 'fácil' | 'medio' | 'difícil'; coronaReward: number; hints?: string[] }>;
  startNewRound: (phraseIndex: number, coronaReward: number) => void;
  revealVowel: () => void;
  revealConsonant: () => void;
  handleLetterReveal: (position: number) => void;
  handlePhraseComplete: () => void;
  showCompletion: boolean;
  setShowCompletion: (show: boolean) => void;
  handleAnimationComplete: () => void;
  addCustomPhrase: (phrase: { text: string; category: string; difficulty: 'fácil' | 'medio' | 'difícil'; coronaReward: number; hints?: string[] }) => void;
  removePhrase: (index: number) => void;
  purchaseVowel: (username: string) => Promise<void>;
  purchaseConsonant: (username: string) => Promise<void>;
  purchaseHint: (username: string) => Promise<void>;
  streamerUsername: string;
  setStreamerUsername: (username: string) => void;
  botConnected: boolean;
  setBotConnected: (connected: boolean) => void;
  currentWinner: WinnerData | null;
  setCurrentWinner: (winner: WinnerData | null) => void;
  resetBoard: () => void;
  currentPhraseHints: string[];
}

const SimpleGameContext = createContext<SimpleGameContextType | undefined>(undefined);

export const useSimpleGame = () => {
  const context = useContext(SimpleGameContext);
  if (!context) {
    throw new Error('useSimpleGame must be used within a SimpleGameProvider');
  }
  return context;
};

interface SimpleGameProviderProps {
  children: ReactNode;
}

export const SimpleGameProvider: React.FC<SimpleGameProviderProps> = ({ children }) => {
  const sounds = useSoundEffects();

  
  // Default clean state
  const getCleanState = (): GameState => ({
    currentPhrase: null,
    isGameActive: false,
    roundNumber: 1,
    winners: [],
    tokensPerWinner: 100
  });

  const [gameState, setGameState] = useState<GameState>(getCleanState);
  const [showCompletion, setShowCompletion] = useState(false);
  const [availablePhrases, setAvailablePhrases] = useState([
    {
      text: "INTELIGENCIA ARTIFICIAL",
      category: "Tecnología",
      difficulty: "difícil" as const,
      coronaReward: 10,
      hints: ["Sistema que simula la mente humana", "Se usa en robots y computadoras avanzadas", "AI en inglés"]
    },
    {
      text: "PIZZA HAWAIANA",
      category: "Comida",
      difficulty: "medio" as const,
      coronaReward: 5,
      hints: ["Comida italiana con fruta tropical", "Lleva piña y jamón", "Muy controversial en Italia"]
    },
    {
      text: "TORRE EIFFEL",
      category: "Lugares",
      difficulty: "medio" as const,
      coronaReward: 5,
      hints: ["Símbolo de la ciudad del amor", "Estructura de hierro muy alta", "Construida por Gustave en París"]
    },
    {
      text: "HOLA MUNDO",
      category: "Tecnología",
      difficulty: "fácil" as const,
      coronaReward: 3,
      hints: ["Primer programa que aprende un desarrollador", "Saludo universal en programación", "Hello World en español"]
    }
  ]);
  const [streamerUsername, setStreamerUsername] = useState('tu_usuario_tiktok');
  const [botConnected, setBotConnected] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<WinnerData | null>(null);
  const [currentPhraseHints, setCurrentPhraseHints] = useState<string[]>([]);

  // Load initial state
  useEffect(() => {
    simpleSync.clear();
    
    const saved = simpleSync.loadState();
    if (saved && saved.currentPhrase !== undefined && !saved.diagnostic) {
      setGameState(saved);
    } else {
      const cleanState = getCleanState();
      setGameState(cleanState);
      simpleSync.saveState(cleanState);
    }
  }, []);

  // Subscribe to cross-tab updates
  useEffect(() => {
    const unsubscribe = simpleSync.subscribe((newState: GameState) => {
      if (newState && newState.currentPhrase !== undefined) {
        setGameState(newState);
      }
    });

    return unsubscribe;
  }, []);

  // Listen for winners from TikTok Live
  useEffect(() => {
    console.log('%c🎯 CONFIGURANDO LISTENER DE GANADORES...', 'color: purple; font-size: 16px; font-weight: bold;');

    const unsubscribe = winnerService.subscribe((winner: WinnerData) => {
      console.log('%c🚀🚀🚀 GANADOR RECIBIDO EN CONTEXTO! 🚀🚀🚀', 'color: yellow; font-size: 24px; font-weight: bold; background: purple; padding: 10px;');
      console.log('%c🎮 Iniciando animación y revelando letras...', 'color: white; font-size: 18px; background: orange; padding: 5px;');

      // Play epic winner celebration sound
      sounds.winnerCelebration();

      setCurrentWinner(winner);
      setShowCompletion(true);

      // REVELAR TODAS LAS LETRAS en el GameBoard cuando hay ganador
      if (gameState.currentPhrase && gameState.currentPhrase.tiles) {
        console.log('%c✨ REVELANDO TODAS LAS LETRAS ✨', 'color: lime; font-size: 18px; font-weight: bold; background: black; padding: 5px;');
        const updatedPhrase = {
          ...gameState.currentPhrase,
          tiles: gameState.currentPhrase.tiles.map(tile => ({
            ...tile,
            isRevealed: true
          }))
        };
        const newState = {
          ...gameState,
          currentPhrase: updatedPhrase
        };
        setGameState(newState);
        simpleSync.saveState(newState);

        // Enviar letras reveladas actualizadas al servidor
        updateRevealedLettersOnServer(updatedPhrase);
      }

      // Auto-clear winner after animation
      setTimeout(() => {
        console.log('%c🔄 Limpiando estado del ganador...', 'color: gray; font-size: 14px;');
        setCurrentWinner(null);
        setShowCompletion(false);
      }, 11000); // 11 seconds (1 segundo más que la animación)
    });

    return unsubscribe;
  }, [gameState]);

  // Define reveal functions BEFORE the useEffect that uses them
  const revealVowel = () => {
    if (gameState.currentPhrase) {
      const updatedPhrase = revealRandomVowel(gameState.currentPhrase);
      const newState = {
        ...gameState,
        currentPhrase: updatedPhrase
      };
      setGameState(newState);
      simpleSync.saveState(newState);

      // Play golden vowel sound
      sounds.goldVowelReveal();

      // Enviar letras reveladas actualizadas al servidor
      updateRevealedLettersOnServer(updatedPhrase);
    }
  };

  const revealConsonant = () => {
    if (gameState.currentPhrase) {
      const updatedPhrase = revealRandomConsonant(gameState.currentPhrase);
      const newState = {
        ...gameState,
        currentPhrase: updatedPhrase
      };
      setGameState(newState);
      simpleSync.saveState(newState);

      // Play consonant sound
      sounds.consonantReveal();

      // Enviar letras reveladas actualizadas al servidor
      updateRevealedLettersOnServer(updatedPhrase);
    }
  };

  // NUEVO SISTEMA: Escuchar revelaciones del backend y aplicarlas directamente
  useEffect(() => {
    console.log('%c🎁 SISTEMA NUEVO: Escuchando revelaciones directas del backend...', 'color: orange; font-size: 16px; font-weight: bold;');

    let processedRevealIds = new Set<string>();

    const stopPolling = tiktokLiveService.startStatusPolling((status) => {
      if (status && status.backendReveal && !processedRevealIds.has(status.backendReveal.id)) {
        const reveal = status.backendReveal;
        console.log(`%c🎯 REVELACIÓN DEL BACKEND: ${reveal.type} = ${reveal.letter}`, 'color: lime; font-size: 16px; font-weight: bold;');

        processedRevealIds.add(reveal.id);

        // Aplicar la letra revelada directamente al estado
        setGameState(currentState => {
          if (currentState.currentPhrase) {
            const updatedPhrase = {
              ...currentState.currentPhrase,
              tiles: currentState.currentPhrase.tiles.map(tile => {
                if (!tile.isSpace && normalizeForComparison(tile.letter) === normalizeForComparison(reveal.letter)) {
                  return { ...tile, isRevealed: true };
                }
                return tile;
              })
            };

            const newState = {
              ...currentState,
              currentPhrase: updatedPhrase
            };
            simpleSync.saveState(newState);

            console.log(`%c✅ APLICADO: Letra ${reveal.letter} revelada en todas sus posiciones`, 'color: green; font-size: 14px; font-weight: bold;');
            return newState;
          }
          return currentState;
        });

        // Limpiar IDs viejos
        if (processedRevealIds.size > 20) {
          const idsArray = Array.from(processedRevealIds);
          processedRevealIds = new Set(idsArray.slice(-10));
        }
      }
    }, 1000);

    return stopPolling;
  }, []);

  const startNewRound = (phraseIndex: number = 0, coronaReward: number = 5) => {
    console.log('%c🚨 [SIMPLE-CONTEXT] ===== START NEW ROUND CALLED =====', 'color: red; font-size: 20px; font-weight: bold;');
    console.log('%c🎮 [SIMPLE-CONTEXT] Starting new round with phrase index:', 'color: blue; font-size: 16px;', phraseIndex);
    alert('🚨 SIMPLE CONTEXT - START NEW ROUND LLAMADO - Verifica la consola F12!');

    const selectedPhrase = availablePhrases[phraseIndex];
    console.log('📝 [SIMPLE-CONTEXT] Selected phrase:', selectedPhrase);

    if (!selectedPhrase) {
      console.error('❌ [SIMPLE-CONTEXT] No phrase found at index:', phraseIndex);
      return;
    }

    const phrase = createPhraseFromText(
      `phrase-${Date.now()}`,
      selectedPhrase.text,
      selectedPhrase.category,
      selectedPhrase.difficulty
    );

    // Add corona reward to the phrase
    phrase.coronaReward = coronaReward;

    const newState: GameState = {
      currentPhrase: phrase,
      isGameActive: true,
      winners: [],
      roundNumber: gameState.roundNumber,
      tokensPerWinner: gameState.tokensPerWinner
    };

    setGameState(newState);
    simpleSync.saveState(newState);

    // Guardar hints de la frase actual
    const hintsToUse = selectedPhrase.hints || [];
    setCurrentPhraseHints(hintsToUse);
    console.log('🎯 [START-NEW-ROUND] Frase seleccionada:', selectedPhrase);
    console.log('💡 [START-NEW-ROUND] Hints a usar:', hintsToUse);

    // Enviar hints al servidor DESPUÉS de un pequeño delay para asegurar que el juego esté activo
    setTimeout(() => {
      updateHintsOnServer(hintsToUse);
    }, 1000);

    sounds.gameStart();

    // Enviar estado del juego al servidor TikTok Live
    sendGameStateToTikTokLive(phrase, selectedPhrase.text, selectedPhrase.category, true);
  };

  const sendGameStateToTikTokLive = async (phrase: any, answer: string, category: string, isActive: boolean) => {
    console.log('🚨 [SIMPLE-CONTEXT] ===== ENVIANDO ESTADO A TIKTOK LIVE =====');
    console.log('📡 [SIMPLE-CONTEXT] Datos a enviar:', {
      phraseText: phrase.text,
      answer: answer,
      category: category,
      isActive: isActive,
      coronaReward: phrase.coronaReward
    });

    try {
      const payload = {
        phrase: phrase.text,
        answer: answer,
        category: category,
        isActive: isActive,
        coronaReward: phrase.coronaReward || 5 // Include corona reward in payload
      };

      console.log('📦 [SIMPLE-CONTEXT] Payload JSON:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/tiktok-live-game-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('📨 [SIMPLE-CONTEXT] Respuesta del servidor:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ [SIMPLE-CONTEXT] Estado del juego enviado exitosamente:', responseData);
      } else {
        const errorText = await response.text();
        console.error('❌ [SIMPLE-CONTEXT] Error enviando estado del juego:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ [SIMPLE-CONTEXT] Error de red enviando estado del juego:', error);
    }

    console.log('🚨 [SIMPLE-CONTEXT] ===== FIN ENVÍO ESTADO =====');
  };

  const handleLetterReveal = (position: number) => {
    // Letter reveal handled by GameBoard
  };

  const handlePhraseComplete = () => {
    setShowCompletion(true);
    sounds.winnerCelebration();
  };

  const handleAnimationComplete = () => {
    setShowCompletion(false);
    const newState = {
      ...gameState,
      isGameActive: false,
      roundNumber: gameState.roundNumber + 1
    };
    setGameState(newState);
    simpleSync.saveState(newState);
  };


  const addCustomPhrase = (phrase: { text: string; category: string; difficulty: 'fácil' | 'medio' | 'difícil'; coronaReward: number }) => {
    setAvailablePhrases(prev => [...prev, phrase]);
  };

  const removePhrase = (index: number) => {
    setAvailablePhrases(prev => prev.filter((_, i) => i !== index));
  };

  const getRevealedLetters = () => {
    if (!gameState.currentPhrase) return [];
    return gameState.currentPhrase.tiles
      .filter(tile => tile.isRevealed)
      .map(tile => tile.letter);
  };

  // Función para enviar letras reveladas al servidor
  const updateRevealedLettersOnServer = async (phrase: any) => {
    if (!phrase) return;

    const revealedLetters = phrase.tiles
      .filter((tile: any) => tile.isRevealed)
      .map((tile: any) => tile.letter);

    try {
      console.log('📡 [UPDATE REVEALED] Enviando letras reveladas al servidor:', revealedLetters);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/update-revealed-letters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ revealedLetters })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [UPDATE REVEALED] Letras reveladas actualizadas en servidor:', data.revealedLetters);
      } else {
        console.error('❌ [UPDATE REVEALED] Error actualizando letras reveladas:', response.status);
      }
    } catch (error) {
      console.error('❌ [UPDATE REVEALED] Error de red:', error);
    }
  };

  // Función para enviar hints al servidor
  const updateHintsOnServer = async (hints: string[]) => {
    try {
      console.log('💡 [UPDATE HINTS] Enviando hints al servidor:', hints);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/update-game-hints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hints })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [UPDATE HINTS] Hints actualizadas en servidor:', data.hints);
      } else {
        console.error('❌ [UPDATE HINTS] Error actualizando hints:', response.status);
      }
    } catch (error) {
      console.error('❌ [UPDATE HINTS] Error de red:', error);
    }
  };

  const purchaseVowel = async (username: string) => {
    if (!gameState.currentPhrase || !streamerUsername) {
      console.error('No active phrase or streamer username not set');
      return;
    }

    try {
      const response = await tiktokBotService.purchaseVowel({
        phrase: gameState.currentPhrase.text,
        revealedLetters: getRevealedLetters(),
        category: gameState.currentPhrase.category,
        username,
        streamerUsername
      });

      if (response.success) {
        console.log('Vowel purchase successful:', response);
      } else {
        console.error('Vowel purchase failed:', response.error);
      }
    } catch (error) {
      console.error('Error purchasing vowel:', error);
    }
  };

  const purchaseConsonant = async (username: string) => {
    if (!gameState.currentPhrase || !streamerUsername) {
      console.error('No active phrase or streamer username not set');
      return;
    }

    try {
      const response = await tiktokBotService.purchaseConsonant({
        phrase: gameState.currentPhrase.text,
        revealedLetters: getRevealedLetters(),
        category: gameState.currentPhrase.category,
        username,
        streamerUsername
      });

      if (response.success) {
        console.log('Consonant purchase successful:', response);
      } else {
        console.error('Consonant purchase failed:', response.error);
      }
    } catch (error) {
      console.error('Error purchasing consonant:', error);
    }
  };

  const purchaseHint = async (username: string) => {
    if (!gameState.currentPhrase || !streamerUsername) {
      console.error('No active phrase or streamer username not set');
      return;
    }

    try {
      const response = await tiktokBotService.purchaseHint({
        phrase: gameState.currentPhrase.text,
        category: gameState.currentPhrase.category,
        username,
        streamerUsername
      });

      if (response.success) {
        console.log('Hint purchase successful:', response);
      } else {
        console.error('Hint purchase failed:', response.error);
      }
    } catch (error) {
      console.error('Error purchasing hint:', error);
    }
  };

  const resetBoard = () => {
    const cleanState = getCleanState();
    setGameState(cleanState);
    simpleSync.saveState(cleanState);
    setCurrentPhraseHints([]); // Limpiar hints
    sendGameStateToTikTokLive(null, "", "", false);
  };

  const value: SimpleGameContextType = {
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
    addCustomPhrase,
    removePhrase,
    purchaseVowel,
    purchaseConsonant,
    purchaseHint,
    streamerUsername,
    setStreamerUsername,
    botConnected,
    setBotConnected,
    currentWinner,
    setCurrentWinner,
    resetBoard,
    currentPhraseHints
  };

  return (
    <SimpleGameContext.Provider value={value}>
      {children}
    </SimpleGameContext.Provider>
  );
};