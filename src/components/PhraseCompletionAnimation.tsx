import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface WinnerData {
  username: string;
  unique_id: string;
  profile_picture?: string;
  comment: string;
  answer: string;
  phrase: string;
  category: string;
}

interface PhraseCompletionAnimationProps {
  isVisible: boolean;
  phraseText: string;
  winner?: WinnerData | null;
  onAnimationComplete?: () => void;
}

const PhraseCompletionAnimation: React.FC<PhraseCompletionAnimationProps> = ({
  isVisible,
  phraseText,
  winner,
  onAnimationComplete
}) => {
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowFireworks(true);
      const timer = setTimeout(() => {
        setShowFireworks(false);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onAnimationComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="phrase-completion-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Fireworks Effect */}
          {showFireworks && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`firework-${i}`}
                  className="firework"
                  style={{
                    left: `${20 + (i * 10)}%`,
                    top: `${30 + (i % 2) * 40}%`
                  }}
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{
                    scale: 1.5,
                    rotate: 360,
                    opacity: 1
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: i * 0.2,
                    repeat: 2
                  }}
                />
              ))}
              
              {/* Confetti */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`confetti-${i}`}
                  className="confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    backgroundColor: ['#ff6b35', '#ffd700', '#8a2be2', '#4169e1', '#f44336'][i % 5]
                  }}
                  initial={{ 
                    y: -100,
                    rotate: 0,
                    scale: 0
                  }}
                  animate={{ 
                    y: window.innerHeight + 100,
                    rotate: 720,
                    scale: 1
                  }}
                  transition={{ 
                    duration: 3,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
            </>
          )}

          {/* Winner Celebration */}
          <motion.div
            className="winner-celebration"
            initial={{ scale: 0, y: 50 }}
            animate={{
              scale: 1,
              y: 0
            }}
            transition={{
              duration: 0.8,
              type: "spring",
              stiffness: 200
            }}
            style={{
              position: 'absolute',
              top: '20%',
              left: '25%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              zIndex: 1000,
              width: '100%',
              maxWidth: '500px'
            }}
          >
            {/* GANADOR Title */}
            <motion.div
              className="winner-title"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              style={{
                fontSize: '4rem',
                fontWeight: 900,
                color: '#FFD700',
                textShadow: '0 0 30px rgba(255, 215, 0, 0.8)',
                marginBottom: '2rem'
              }}
            >
              🎉 ¡GANADOR! 🎉
            </motion.div>

            {/* Winner Profile */}
            {winner && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{ marginBottom: '2rem' }}
              >
                {/* Profile Picture */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                  style={{
                    display: 'inline-block',
                    marginBottom: '1rem',
                    position: 'relative'
                  }}
                >
                  {winner.profile_picture ? (
                    <img
                      src={winner.profile_picture}
                      alt={winner.username}
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        border: '6px solid #FFD700',
                        boxShadow: '0 0 30px rgba(255, 215, 0, 0.7)',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        console.log('❌ ERROR CARGANDO IMAGEN DE PERFIL:');
                        console.log('🔗 URL Original:', winner.profile_picture);
                        console.log('🔄 Cambiando a avatar por defecto...');

                        // Try different approaches for TikTok images
                        const img = e.currentTarget as HTMLImageElement;
                        const originalSrc = img.src;

                        // Try without CORS headers first
                        if (originalSrc === winner.profile_picture) {
                          img.crossOrigin = '';
                          console.log('🔄 Intentando sin CORS...');
                          return;
                        }

                        // If still fails, hide this image and show default
                        img.style.display = 'none';
                        const nextElement = img.nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = 'flex';
                        }
                      }}
                      onLoad={() => {
                        console.log('✅ IMAGEN DE PERFIL CARGADA EXITOSAMENTE!');
                        console.log('🖼️ URL:', winner.profile_picture);
                        console.log('📊 Dimensiones:', (e.target as HTMLImageElement).naturalWidth + 'x' + (e.target as HTMLImageElement).naturalHeight);
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      display: winner.profile_picture ? 'none' : 'flex',
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      border: '6px solid #FFD700',
                      boxShadow: '0 0 30px rgba(255, 215, 0, 0.7)',
                      background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3rem',
                      fontWeight: 'bold',
                      color: 'white'
                    }}
                  >
                    {winner.username ? winner.username.charAt(0).toUpperCase() : '?'}
                  </div>
                </motion.div>

                {/* Winner Name */}
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '0.5rem',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                  }}
                >
                  {winner.username || winner.unique_id || "Ganador Anónimo"}
                </motion.h2>

                {/* @username */}
                {winner.unique_id && winner.username !== winner.unique_id && (
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    style={{
                      fontSize: '1.5rem',
                      color: '#FCD34D',
                      marginBottom: '1.5rem'
                    }}
                  >
                    @{winner.unique_id}
                  </motion.p>
                )}

                {/* Winner Comment */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.2, type: "spring" }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    maxWidth: '500px',
                    margin: '0 auto'
                  }}
                >
                  <p style={{ fontSize: '1rem', color: 'white', marginBottom: '0.5rem' }}>
                    💬 Respuesta ganadora:
                  </p>
                  <p style={{ fontSize: '1.5rem', color: '#FCD34D', fontWeight: 'bold' }}>
                    "{winner.comment}"
                  </p>
                </motion.div>
              </motion.div>
            )}


            {/* Coronas */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 1.8,
                type: "spring",
                stiffness: 300
              }}
              style={{
                fontSize: '1.8rem',
                color: '#FFD700',
                fontWeight: 'bold'
              }}
            >
              👑 ¡100 CORONAS GANADAS! 👑
            </motion.div>

            {/* Final Message */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 2.2, duration: 0.8, type: "spring" }}
              style={{
                marginTop: '1.5rem',
                fontSize: '1.5rem',
                color: 'white'
              }}
            >
              🏆 ¡FELICITACIONES! 🏆
            </motion.div>
          </motion.div>

          {/* Sparkle Rain */}
          <div className="sparkle-rain">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="sparkle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`
                }}
                animate={{
                  y: window.innerHeight + 50,
                  opacity: 1,
                  scale: 1
                }}
                transition={{
                  duration: 4,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                ⭐
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhraseCompletionAnimation;