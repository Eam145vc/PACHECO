import React from 'react';
import { motion } from 'framer-motion';
import { useSimpleGame } from '../contexts/SimpleGameContext';
import PhraseCompletionAnimation from '../components/PhraseCompletionAnimation';
import { usePageZoom } from '../hooks/usePageZoom';
import '../styles/StreamOverlay.css';

const StreamOverlay: React.FC = () => {
  const { gameState, currentWinner, setCurrentWinner, showCompletion, setShowCompletion } = useSimpleGame();
  const { zoomStyle } = usePageZoom({ pageId: 'stream-overlay' });

  return (
    <div className="stream-overlay" style={zoomStyle}>
      {/* Round Info */}
      <motion.div 
        className="round-info-overlay"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="round-number">Ronda {gameState.roundNumber}</div>
        {gameState.currentPhrase && (
          <div className="corona-reward">
            👑 {gameState.currentPhrase.coronaReward} coronas en juego
          </div>
        )}
      </motion.div>

      {/* Game Status */}
      {gameState.isGameActive && gameState.currentPhrase && (
        <motion.div 
          className="game-status-overlay"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="phrase-category">
            📂 {gameState.currentPhrase.category}
          </div>
          <div className="phrase-difficulty">
            ⭐ {gameState.currentPhrase.difficulty}
          </div>
        </motion.div>
      )}

      {/* Corona Info */}
      {gameState.currentPhrase && (
        <motion.div 
          className="corona-info-overlay"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3>👑 Premio de la Frase</h3>
          <div className="corona-prize">
            <span className="corona-count">{gameState.currentPhrase.coronaReward}</span>
            <span className="corona-text">Coronas</span>
          </div>
          <div className="corona-message">
            ¡Adivina la frase para ganar!
          </div>
        </motion.div>
      )}

      {/* Winners Alert */}
      {gameState.winners.length > 0 && (
        <motion.div 
          className="winners-alert"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h3>🎉 ¡Ganador de la Frase!</h3>
          <div className="winners-list">
            {gameState.winners.map((winner, index) => (
              <motion.div
                key={winner}
                className="winner-name"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                👑 {winner}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Phrase Completion Animation */}
      <PhraseCompletionAnimation
        isVisible={showCompletion}
        phraseText={gameState.currentPhrase?.text || ''}
        winner={currentWinner}
        onAnimationComplete={() => setShowCompletion(false)}
      />
    </div>
  );
};

export default StreamOverlay;