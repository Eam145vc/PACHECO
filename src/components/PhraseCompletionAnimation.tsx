import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// TikTok Profile Image Component
interface TikTokProfileImageProps {
  profileUrl: string;
  profileUrls?: string[]; // Array of URLs to try
  username: string;
  onImageLoad?: () => void;
  onImageError?: () => void;
}

const TikTokProfileImage: React.FC<TikTokProfileImageProps> = ({
  profileUrl,
  profileUrls,
  username,
  onImageLoad,
  onImageError
}) => {
  const [imageError, setImageError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(profileUrl);
  const [urlIndex, setUrlIndex] = useState(0);

  // Create array of URLs to try
  const urlsToTry = profileUrls || [profileUrl];

  useEffect(() => {
    setCurrentUrl(urlsToTry[0]);
    setImageError(false);
    setUrlIndex(0);
  }, [profileUrl, profileUrls]);

  const handleImageError = () => {
    console.log('❌ ERROR CARGANDO IMAGEN DE PERFIL DE TIKTOK:');
    console.log('🔗 URL Fallida:', currentUrl);
    console.log('📋 Índice actual:', urlIndex);

    // Try next URL if available
    const nextIndex = urlIndex + 1;
    if (nextIndex < urlsToTry.length) {
      console.log(`🔄 Intentando URL ${nextIndex + 1}/${urlsToTry.length}...`);
      setCurrentUrl(urlsToTry[nextIndex]);
      setUrlIndex(nextIndex);
      return;
    }

    // Try format conversion on the last failed URL
    if (currentUrl.includes('.webp')) {
      const jpegUrl = currentUrl.replace('.webp', '.jpeg');
      console.log('🔄 Intentando convertir a JPEG...');
      setCurrentUrl(jpegUrl);
      return;
    }

    // If all attempts fail, show error state
    console.log('🔄 Todas las URLs fallaron, usando avatar por defecto...');
    setImageError(true);
    onImageError?.();
  };

  const handleImageLoad = () => {
    console.log('✅ IMAGEN DE PERFIL DE TIKTOK CARGADA!');
    console.log('🖼️ URL exitosa:', currentUrl);
    setImageError(false);
    onImageLoad?.();
  };

  if (imageError) {
    return (
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          border: '6px solid #FFD700',
          boxShadow: '0 0 30px rgba(255, 215, 0, 0.7)',
          background: 'linear-gradient(135deg, #ff0050, #ff4081)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '3rem',
          fontWeight: 'bold',
          color: 'white',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}
      >
        {username ? username.charAt(0).toUpperCase() : '👤'}
      </div>
    );
  }

  return (
    <img
      src={currentUrl}
      alt={`${username} profile`}
      style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        border: '6px solid #FFD700',
        boxShadow: '0 0 30px rgba(255, 215, 0, 0.7)',
        objectFit: 'cover'
      }}
      onError={handleImageError}
      onLoad={handleImageLoad}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
    />
  );
};

interface WinnerData {
  username: string;
  unique_id: string;
  profile_picture?: string;
  profile_picture_urls?: string[]; // Array of TikTok URLs
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
              position: 'fixed',
              top: '50%',
              left: '25%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 1000,
              width: '90vw',
              maxWidth: '600px'
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
                  {(winner.profile_picture || winner.profile_picture_urls) && (
                    <TikTokProfileImage
                      profileUrl={winner.profile_picture || (winner.profile_picture_urls?.[0] || '')}
                      profileUrls={winner.profile_picture_urls}
                      username={winner.username}
                      onImageLoad={() => console.log('✅ TikTok profile image loaded successfully')}
                      onImageError={() => console.log('❌ Failed to load TikTok profile image')}
                    />
                  )}
                  {!winner.profile_picture && !winner.profile_picture_urls && (
                    <div
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        border: '6px solid #FFD700',
                        boxShadow: '0 0 30px rgba(255, 215, 0, 0.7)',
                        background: 'linear-gradient(135deg, #ff0050, #ff4081)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        fontWeight: 'bold',
                        color: 'white',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                      }}
                    >
                      {winner.username ? winner.username.charAt(0).toUpperCase() : '👤'}
                    </div>
                  )}
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