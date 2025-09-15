import '../styles/GameBoard.css';
import { motion, AnimatePresence } from 'framer-motion';
import { GamePhrase } from '../types/game';
import { useSoundEffects } from '../hooks/useSoundEffects';
import LetterTile from './LetterTile';

interface GameBoardProps {
  phrase: GamePhrase | null;
  onLetterReveal?: (position: number) => void;
  onPhraseComplete?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  phrase, 
  onLetterReveal, 
  onPhraseComplete 
}) => {
  const sounds = useSoundEffects();
  

  const checkPhraseComplete = () => {
    if (!phrase) return;
    
    const isComplete = phrase.tiles.every(tile => 
      tile.isSpace || tile.isRevealed
    );
    
    if (isComplete) {
      sounds.phraseComplete();
      if (onPhraseComplete) {
        onPhraseComplete();
      }
    }
  };

  const handleLetterReveal = (position: number) => {
    if (onLetterReveal) {
      onLetterReveal(position);
    }
    setTimeout(checkPhraseComplete, 1000);
  };

  if (!phrase) {
    return (
      <div className="game-board-empty">
        <motion.div
          className="waiting-message"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🎯 Esperando la siguiente frase...
        </motion.div>
      </div>
    );
  }

  const getWordsFromTiles = () => {
    const words: Array<Array<typeof phrase.tiles[0]>> = [[]];
    let currentWordIndex = 0;

    phrase.tiles.forEach(tile => {
      if (tile.isSpace) {
        if (words[currentWordIndex].length > 0) {
          currentWordIndex++;
          words.push([]);
        }
      } else {
        words[currentWordIndex].push(tile);
      }
    });

    return words.filter(word => word.length > 0);
  };

  const words = getWordsFromTiles();

  return (
    <div className="game-board">
      <AnimatePresence>
        <motion.div
          className="phrase-container"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <div className="category-badge">
            <motion.span
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(255, 215, 0, 0.5)",
                  "0 0 40px rgba(255, 215, 0, 0.8)",
                  "0 0 20px rgba(255, 215, 0, 0.5)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {phrase.category.toUpperCase()}
            </motion.span>
          </div>
          
          <div className="difficulty-indicator">
            <span className={`difficulty ${phrase.difficulty}`}>
              {phrase.difficulty.toUpperCase()}
            </span>
          </div>

          <div className="words-container">
            {words.map((word, wordIndex) => (
              <motion.div
                key={`word-${wordIndex}`}
                className="word-row"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: wordIndex * 0.1,
                  duration: 0.5,
                  type: "spring"
                }}
              >
                {word.map((tile, tileIndex) => (
                  <LetterTile
                    key={`${wordIndex}-${tileIndex}-${tile.position}`}
                    tile={tile}
                    onReveal={() => handleLetterReveal(tile.position)}
                    playSound={sounds.letterReveal}
                  />
                ))}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default GameBoard;