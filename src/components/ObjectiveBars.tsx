import { motion } from 'framer-motion';
import { Target, Heart, Gift } from 'lucide-react';

interface ObjectiveProgress {
  type: 'vowel' | 'consonant';
  current: number;
  target: number;
  triggerType: 'likes' | 'gifts';
  giftName?: string;
}

interface ObjectiveBarsProps {
  objectives: ObjectiveProgress[];
  isGameActive: boolean;
}

const ObjectiveBars: React.FC<ObjectiveBarsProps> = ({ objectives, isGameActive }) => {
  if (!isGameActive || objectives.length === 0) {
    return null;
  }

  const getTypeColor = (type: 'vowel' | 'consonant') => {
    return type === 'vowel' ? '#ec4899' : '#3b82f6';
  };

  const getTypeIcon = (type: 'vowel' | 'consonant') => {
    return type === 'vowel' ? '🔤' : '🔠';
  };

  const getTriggerIcon = (triggerType: 'likes' | 'gifts') => {
    return triggerType === 'likes' ? <Heart size={16} /> : <Gift size={16} />;
  };

  return (
    <motion.div
      className="objective-bars"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.6, type: "spring" }}
    >
      <div className="objectives-container">
        {objectives.map((objective, index) => {
          const progress = Math.min((objective.current / objective.target) * 100, 100);
          const remaining = Math.max(objective.target - objective.current, 0);
          
          return (
            <motion.div
              key={`${objective.type}-${index}`}
              className="objective-card"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="objective-header">
                <div 
                  className="objective-icon"
                  style={{ color: getTypeColor(objective.type) }}
                >
                  <span className="type-emoji">{getTypeIcon(objective.type)}</span>
                  <div className="trigger-icon">
                    {getTriggerIcon(objective.triggerType)}
                  </div>
                </div>
                
                <div className="objective-info">
                  <div className="objective-label">
                    {objective.type === 'vowel' ? 'Vocal' : 'Consonante'}
                  </div>
                  <div className="objective-trigger">
                    {objective.triggerType === 'likes' ? 'Likes' : 
                     objective.giftName ? objective.giftName : 'Regalos'}
                  </div>
                </div>
                
                <div className="objective-counter">
                  <span className="current">{objective.current}</span>
                  <span className="separator">/</span>
                  <span className="target">{objective.target}</span>
                </div>
              </div>

              <div className="progress-container">
                <div 
                  className="progress-track"
                  style={{ background: `${getTypeColor(objective.type)}20` }}
                >
                  <motion.div
                    className="progress-fill"
                    style={{ 
                      background: `linear-gradient(90deg, ${getTypeColor(objective.type)}, ${getTypeColor(objective.type)}dd)`
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, type: "spring" }}
                  />
                  
                  <motion.div
                    className="progress-pulse"
                    animate={{
                      opacity: progress >= 100 ? 0.75 : 0,
                      scale: progress >= 100 ? 1.02 : 1
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: progress >= 100 ? Infinity : 0 
                    }}
                  />
                </div>
                
                <div className="progress-labels">
                  <span className="progress-percent">
                    {Math.round(progress)}%
                  </span>
                  {remaining > 0 && (
                    <span className="remaining">
                      {remaining} restantes
                    </span>
                  )}
                  {progress >= 100 && (
                    <motion.span 
                      className="ready-label"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ¡LISTO!
                    </motion.span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ObjectiveBars;