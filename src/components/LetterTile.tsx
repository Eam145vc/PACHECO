import { motion } from 'framer-motion';
import { LetterTile as LetterTileType } from '../types/game';

interface LetterTileProps {
  tile: LetterTileType;
  onReveal?: () => void;
  playSound?: () => void;
}

const LetterTile: React.FC<LetterTileProps> = ({ tile, onReveal, playSound }) => {
  if (tile.isSpace) {
    return <div className="letter-tile-space" />;
  }

  return (
    <motion.div
      className="letter-tile"
      initial={{ rotateY: 0 }}
      animate={{ 
        rotateY: tile.isRevealed ? 360 : 0
      }}
      transition={{ 
        duration: 0.6,
        ease: "easeInOut"
      }}
      whileHover={{ scale: 1.05 }}
      onAnimationComplete={() => {
        if (tile.isRevealed) {
          if (playSound) playSound();
          if (onReveal) onReveal();
        }
      }}
    >
      <motion.div
        className="tile-front"
        animate={{ 
          opacity: tile.isRevealed ? 0 : 1,
          rotateY: tile.isRevealed ? -180 : 0
        }}
        transition={{ duration: 0.4 }}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <div className="tile-question-mark">?</div>
        <div className="tile-glow" />
      </motion.div>
      
      <motion.div
        className="tile-back"
        animate={{ 
          opacity: tile.isRevealed ? 1 : 0,
          rotateY: tile.isRevealed ? 0 : 180
        }}
        transition={{ duration: 0.4, delay: tile.isRevealed ? 0.4 : 0 }}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <div className="tile-letter">{tile.letter.toUpperCase()}</div>
        <motion.div
          className="tile-sparkles"
          animate={{
            opacity: tile.isRevealed ? 1 : 0,
            scale: tile.isRevealed ? 1.2 : 0.8
          }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </motion.div>
    </motion.div>
  );
};

export default LetterTile;