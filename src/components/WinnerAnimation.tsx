import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Trophy, Star, Sparkles } from 'lucide-react';

interface WinnerData {
  username: string;
  unique_id: string;
  profile_picture?: string;
  comment: string;
  answer: string;
  phrase: string;
  category: string;
  coronaReward?: number;
}

interface Phrase {
  id: string;
  text: string;
  category: string;
  difficulty: string;
  tiles: Array<{
    letter: string;
    isRevealed: boolean;
    isSpace: boolean;
    position: number;
  }>;
  coronaReward?: number;
}

interface WinnerAnimationProps {
  winner: WinnerData | null;
  currentPhrase: Phrase | null;
  onComplete: () => void;
}

const WinnerAnimation: React.FC<WinnerAnimationProps> = ({ winner, currentPhrase, onComplete }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [revealedLetters, setRevealedLetters] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (winner && currentPhrase && currentPhrase.tiles) {
      setShowConfetti(true);

      // REVELAR TODAS las letras INMEDIATAMENTE cuando hay ganador
      const allLettersRevealed = new Set<number>();
      currentPhrase.tiles.forEach((tile, index) => {
        if (!tile.isSpace && tile.letter !== ' ') {
          allLettersRevealed.add(index);
        }
      });
      setRevealedLetters(allLettersRevealed);

      // Cerrar animación después de 10 segundos
      const timeout = setTimeout(() => {
        onComplete();
      }, 10000);

      return () => clearTimeout(timeout);
    } else if (winner && (!currentPhrase || !currentPhrase.tiles)) {
      // Fallback: usar winner.answer si no hay currentPhrase
      setShowConfetti(true);

      const phrase = winner.answer.toUpperCase();
      const allLetterIndexes: number[] = [];

      for (let i = 0; i < phrase.length; i++) {
        if (phrase[i] !== ' ') {
          allLetterIndexes.push(i);
        }
      }

      // Revelar TODAS las letras inmediatamente
      setRevealedLetters(new Set(allLetterIndexes));

      const timeout = setTimeout(() => {
        onComplete();
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [winner, currentPhrase, onComplete]);

  if (!winner) return null;

  const renderPhrase = () => {
    if (currentPhrase && currentPhrase.tiles) {
      // Modo normal: usar currentPhrase
      return currentPhrase.tiles.map((tileObj, index) => (
        <motion.span
          key={index}
          className={`inline-block ${tileObj.isSpace ? 'w-8' : 'w-16 h-20 mx-2'}`}
          initial={!tileObj.isSpace ? {
            scale: 0,
            rotateY: 180,
            z: -100,
            opacity: 0
          } : {}}
          animate={!tileObj.isSpace && revealedLetters.has(index) ? {
            scale: 1,
            rotateY: 0,
            z: 0,
            opacity: 1,
            y: 0
          } : {}}
          transition={{
            duration: 0.8,
            type: "spring",
            stiffness: 120,
            damping: 12,
            delay: index * 0.05
          }}
        >
          {tileObj.isSpace ? (
            <span className="w-8 h-1"></span>
          ) : (
            <motion.span
              className={`
                text-7xl font-black flex items-center justify-center
                rounded-xl shadow-2xl border-4 relative overflow-hidden
                ${revealedLetters.has(index)
                  ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 border-yellow-200 text-white'
                  : 'bg-gray-500 border-gray-300 text-gray-300'}
              `}
              animate={revealedLetters.has(index) ? {
                boxShadow: "0 0 30px rgba(255, 215, 0, 0.8), inset 0 0 25px rgba(255, 255, 255, 0.25)",
                scale: 1.02
              } : {}}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Letter glow effect */}
              {revealedLetters.has(index) && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-transparent opacity-50"
                  animate={{
                    opacity: 0.65,
                    scale: 1.0
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              <span className="relative z-10">
                {revealedLetters.has(index) ? tileObj.letter.toUpperCase() : '?'}
              </span>
            </motion.span>
          )}
        </motion.span>
      ));
    } else if (winner) {
      // Modo fallback: usar winner.answer
      return winner.answer.toUpperCase().split('').map((char, index) => (
        <motion.span
          key={index}
          className={`inline-block ${char === ' ' ? 'w-8' : 'w-16 h-20 mx-2'}`}
          initial={char !== ' ' ? {
            scale: 0,
            rotateY: 180,
            z: -100,
            opacity: 0
          } : {}}
          animate={char !== ' ' && revealedLetters.has(index) ? {
            scale: 1,
            rotateY: 0,
            z: 0,
            opacity: 1,
            y: 0
          } : {}}
          transition={{
            duration: 0.8,
            type: "spring",
            stiffness: 120,
            damping: 12,
            delay: index * 0.05
          }}
        >
          {char === ' ' ? (
            <span className="w-8 h-1"></span>
          ) : (
            <motion.span
              className={`
                text-7xl font-black flex items-center justify-center
                rounded-xl shadow-2xl border-4 relative overflow-hidden
                ${revealedLetters.has(index)
                  ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 border-yellow-200 text-white'
                  : 'bg-gray-500 border-gray-300 text-gray-300'}
              `}
              animate={revealedLetters.has(index) ? {
                boxShadow: "0 0 30px rgba(255, 215, 0, 0.8), inset 0 0 25px rgba(255, 255, 255, 0.25)",
                scale: 1.02
              } : {}}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Letter glow effect */}
              {revealedLetters.has(index) && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-transparent opacity-50"
                  animate={{
                    opacity: 0.65,
                    scale: 1.0
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              <span className="relative z-10">
                {revealedLetters.has(index) ? char : '?'}
              </span>
            </motion.span>
          )}
        </motion.span>
      ));
    }

    return null;
  };

  return (
    <AnimatePresence>
      {winner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.3, rotateY: -180 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, scale: 0.3, rotateY: 180 }}
          className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden"
          style={{
            zIndex: 999999,
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backdropFilter: 'blur(5px)'
          }}
          transition={{
            duration: 1.2,
            type: "spring",
            stiffness: 80,
            damping: 15
          }}
        >
        {/* Enhanced Confetti Background */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Golden confetti */}
            {[...Array(80)].map((_, i) => (
              <motion.div
                key={`confetti-${i}`}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 8 + 4,
                  height: Math.random() * 8 + 4,
                  backgroundColor: ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#00CED1'][Math.floor(Math.random() * 5)]
                }}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -20,
                  rotate: 0,
                  scale: 0
                }}
                animate={{
                  y: window.innerHeight + 50,
                  rotate: 720,
                  x: Math.random() * window.innerWidth,
                  scale: 1
                }}
                transition={{
                  duration: Math.random() * 4 + 3,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "easeOut"
                }}
              />
            ))}

            {/* Sparkle effects */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute text-yellow-300"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  fontSize: Math.random() * 20 + 10
                }}
                animate={{
                  scale: 1.5,
                  rotate: 360,
                  opacity: 1
                }}
                transition={{
                  duration: Math.random() * 2 + 1,
                  repeat: Infinity,
                  delay: Math.random() * 3
                }}
              >
                ✨
              </motion.div>
            ))}
          </div>
        )}

        {/* Stars Background */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute text-yellow-300 opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: 1.2,
              rotate: 360,
              opacity: 0.6
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          >
            <Star size={20 + Math.random() * 20} />
          </motion.div>
        ))}

        <div className="text-center px-8 max-w-6xl relative">
          {/* Winner Title with Enhanced Animation */}
          <motion.div
            initial={{ scale: 0, y: -200, rotateX: 90 }}
            animate={{ scale: 1, y: 0, rotateX: 0 }}
            transition={{
              duration: 1.5,
              type: "spring",
              stiffness: 60,
              damping: 10,
              delay: 0.3
            }}
            className="mb-8 relative"
          >
            {/* Glow effect behind title */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              animate={{
                boxShadow: "0 0 100px rgba(255, 215, 0, 0.6)"
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <div className="flex items-center justify-center mb-4 relative z-10">
              <motion.div
                animate={{
                  rotate: 360,
                  scale: 1.15
                }}
                transition={{
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
              >
                <Crown className="text-yellow-400 w-24 h-24 mr-6 drop-shadow-2xl" />
              </motion.div>

              <motion.h1
                className="relative"
                animate={{
                  scale: 1.02,
                  textShadow: "0 0 40px rgba(255, 215, 0, 1)"
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <span className="text-9xl font-black bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500 bg-clip-text text-transparent drop-shadow-2xl">
                  ¡GANADOR!
                </span>
              </motion.h1>

              <motion.div
                animate={{
                  rotate: -360,
                  scale: 1.15,
                  y: -5
                }}
                transition={{
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity },
                  y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <Trophy className="text-yellow-400 w-24 h-24 ml-6 drop-shadow-2xl" />
              </motion.div>
            </div>
          </motion.div>

          {/* Winner Profile */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center mb-6">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1 }}
                animate={{
                  boxShadow: "0 0 30px rgba(255, 215, 0, 0.7)"
                }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
              >
                {winner.profile_picture ? (
                  <img
                    src={winner.profile_picture}
                    alt={winner.username}
                    className="w-40 h-40 rounded-full border-8 border-yellow-400 shadow-2xl object-cover"
                    onError={(e) => {
                      // Si la imagen falla, mostrar avatar por defecto
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="w-40 h-40 rounded-full border-8 border-yellow-400 shadow-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center"
                  style={{ display: winner.profile_picture ? 'none' : 'flex' }}
                >
                  <span className="text-5xl font-bold text-white">
                    {winner.username && winner.username.trim() !== '' ? winner.username.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <motion.div
                  className="absolute -top-2 -right-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="text-yellow-400 w-8 h-8" />
                </motion.div>
              </motion.div>
            </div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-6xl font-bold text-white mb-3 drop-shadow-lg text-center"
            >
              {winner.username && winner.username.trim() !== '' ? winner.username : (winner.unique_id || "Ganador Anónimo")}
            </motion.h2>

            {winner.unique_id && winner.username !== winner.unique_id && (
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-2xl text-yellow-300 mb-4 text-center"
              >
                @{winner.unique_id}
              </motion.p>
            )}

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: "spring" }}
              className="bg-white/20 backdrop-blur-md rounded-2xl p-6 max-w-lg mx-auto"
            >
              <p className="text-xl text-white font-semibold text-center mb-2">
                💬 Respuesta ganadora:
              </p>
              <p className="text-2xl text-yellow-200 font-bold text-center">
                "{winner.comment}"
              </p>
            </motion.div>
          </motion.div>

          {/* Phrase Reveal */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mb-8"
          >
            <h3 className="text-4xl text-yellow-300 font-bold mb-6 text-center">
              📂 Categoría: {winner.category}
            </h3>

            <div className="mb-4">
              <p className="text-2xl text-white font-semibold text-center mb-4">
                🎯 Frase completa:
              </p>
              <div className="flex items-center justify-center flex-wrap gap-2 mb-8">
                {renderPhrase()}
              </div>
            </div>
          </motion.div>

          {/* Celebration Message */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 2.5, duration: 0.8, type: "spring" }}
            className="text-center"
          >
            <p className="text-5xl font-black text-white bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent mb-3">
              ¡FELICITACIONES! 🎉✨
            </p>
            <p className="text-2xl text-yellow-300 mb-2">
              ¡Has adivinado la frase correctamente!
            </p>
            {winner.coronaReward && (
              <motion.div
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 3, duration: 0.6, type: "spring" }}
                className="mb-4"
              >
                <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white px-8 py-4 rounded-full inline-block shadow-2xl border-4 border-yellow-300">
                  <p className="text-3xl font-black flex items-center">
                    👑 +{winner.coronaReward} Coronas Ganadas! 👑
                  </p>
                </div>
              </motion.div>
            )}
            <p className="text-lg text-white/80">
              🏆 ¡Eres el ganador de esta ronda! 🏆
            </p>
          </motion.div>
        </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WinnerAnimation;