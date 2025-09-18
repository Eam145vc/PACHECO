import React from 'react';
import { motion } from 'framer-motion';
import { Heart, UserPlus } from 'lucide-react';
import { useGiftData } from '../hooks/useGiftData';

interface CommunalObjectiveBarProps {
  triggerId: string;
  triggerName: string;
  giftId: string | number;
  giftName: string;
  current: number;
  target: number;
  orientation: 'horizontal' | 'vertical';
  isCompleted: boolean;
  giftImage?: string;
  overlayTitle?: string;
}

const CommunalObjectiveBar: React.FC<CommunalObjectiveBarProps> = ({
  triggerId,
  triggerName,
  giftId,
  giftName,
  current,
  target,
  orientation,
  isCompleted,
  giftImage,
  overlayTitle
}) => {
  const { getGiftImage: getGiftImageFromData, getGiftName } = useGiftData();
  const progress = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);

  // Get actual gift information from regalos.json
  const actualGiftImage = getGiftImageFromData(giftId);
  const actualGiftName = getGiftName(giftId);

  // Get gift image or fallback to icons
  const getGiftDisplay = () => {
    // Always try to use the actual image from regalos.json first
    if (actualGiftImage && actualGiftImage !== '') {
      return (
        <img
          src={actualGiftImage}
          alt={actualGiftName}
          className="gift-image"
          style={{ width: '32px', height: '32px', borderRadius: '50%' }}
          onError={(e) => {
            // Fallback to icons on image error
            const target = e.target as HTMLImageElement;
            if (giftId === 'likes') {
              target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><text y="24" font-size="20">❤️</text></svg>';
            } else if (giftId === 'follows') {
              target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><text y="24" font-size="20">👥</text></svg>';
            } else {
              target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><text y="24" font-size="20">🎁</text></svg>';
            }
          }}
        />
      );
    }

    // Fallback icons for special cases
    if (giftId === 'likes') {
      return <Heart size={24} className="gift-icon likes-icon" />;
    }
    if (giftId === 'follows') {
      return <UserPlus size={24} className="gift-icon follows-icon" />;
    }

    // Default gift icon
    return (
      <div className="gift-icon-placeholder">
        🎁
      </div>
    );
  };

  const containerClass = `communal-objective-bar ${orientation} ${isCompleted ? 'completed' : ''}`;

  // Use overlayTitle if available, otherwise fall back to triggerName
  const displayTitle = overlayTitle && overlayTitle.trim() !== '' ? overlayTitle : triggerName;

  return (
    <motion.div
      className={containerClass}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.6, type: "spring" }}
    >
      {orientation === 'horizontal' ? (
        <>
          {/* Horizontal Layout */}
          <div className="objective-header horizontal">
            <div className="gift-display">
              {getGiftDisplay()}
            </div>
            <div className="objective-info">
              <div className="objective-title">{displayTitle}</div>
              <div className="objective-subtitle">{actualGiftName}</div>
            </div>
            <div className="objective-counter">
              <span className="current">{current}</span>
              <span className="separator">/</span>
              <span className="target">{target}</span>
            </div>
          </div>

          <div className="progress-container horizontal">
            <div className="progress-track">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, type: "spring" }}
              />

              {/* Pulsing effect when completed */}
              {isCompleted && (
                <motion.div
                  className="progress-pulse"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity
                  }}
                />
              )}
            </div>

            <div className="progress-labels">
              <span className="progress-percent">{Math.round(progress)}%</span>
              {remaining > 0 && (
                <span className="remaining">{remaining} restantes</span>
              )}
              {isCompleted && (
                <motion.span
                  className="ready-label"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ¡COMPLETADO!
                </motion.span>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Vertical Layout */}
          <div className="objective-header vertical">
            <div className="gift-display">
              {getGiftDisplay()}
            </div>
            <div className="objective-counter vertical">
              <span className="current">{current}</span>
              <span className="separator">/</span>
              <span className="target">{target}</span>
            </div>
          </div>

          <div className="progress-container vertical">
            <div className="progress-track vertical">
              <motion.div
                className="progress-fill vertical"
                initial={{ height: 0 }}
                animate={{ height: `${progress}%` }}
                transition={{ duration: 0.8, type: "spring" }}
              />

              {/* Pulsing effect when completed */}
              {isCompleted && (
                <motion.div
                  className="progress-pulse vertical"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity
                  }}
                />
              )}
            </div>
          </div>

          <div className="objective-info vertical">
            <div className="objective-title vertical">{displayTitle}</div>
            <div className="objective-subtitle vertical">{actualGiftName}</div>
            {remaining > 0 && (
              <div className="remaining vertical">{remaining} restantes</div>
            )}
            {isCompleted && (
              <motion.div
                className="ready-label vertical"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ¡LISTO!
              </motion.div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default CommunalObjectiveBar;