import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGiftData } from '../hooks/useGiftData';

interface CommunalObjective {
  triggerId: string;
  triggerName: string;
  giftId: string | number;
  giftName: string;
  giftImage?: string;
  current: number;
  target: number;
  enabled: boolean;
  action: 'reveal_vowel' | 'reveal_consonant';
}

interface CommunalObjectivesContextType {
  objectives: CommunalObjective[];
  updateObjective: (triggerId: string, current: number) => void;
  resetObjectives: () => void;
  getObjective: (triggerId: string) => CommunalObjective | undefined;
  loadGiftTriggers: () => void;
}

const CommunalObjectivesContext = createContext<CommunalObjectivesContextType | undefined>(undefined);

interface CommunalObjectivesProviderProps {
  children: ReactNode;
}

export const CommunalObjectivesProvider: React.FC<CommunalObjectivesProviderProps> = ({ children }) => {
  const [objectives, setObjectives] = useState<CommunalObjective[]>([]);
  const { getGiftImage, getGiftName } = useGiftData();

  // Load gift triggers from localStorage
  const loadGiftTriggers = () => {
    try {
      const stored = localStorage.getItem('giftTriggers');
      if (stored) {
        const triggers = JSON.parse(stored);

        // Filter only communal triggers (reveal_vowel and reveal_consonant)
        // Todos los triggers con estas acciones son comunales, independientemente del regalo
        const communalTriggers = triggers.filter((trigger: any) =>
          trigger.enabled &&
          (trigger.action === 'reveal_vowel' || trigger.action === 'reveal_consonant')
        );

        // Convert to objectives format
        const newObjectives: CommunalObjective[] = communalTriggers.map((trigger: any) => ({
          triggerId: trigger.id,
          triggerName: trigger.name,
          giftId: trigger.giftId,
          giftName: getGiftName(trigger.giftId), // Use dynamic name from regalos.json
          giftImage: getGiftImage(trigger.giftId), // Use dynamic image from regalos.json
          current: 0, // Reset to 0 when loading
          target: trigger.quantity,
          enabled: trigger.enabled,
          action: trigger.action
        }));

        setObjectives(newObjectives);
        console.log('🎯 [COMMUNAL] Loaded communal objectives:', newObjectives);
      }
    } catch (error) {
      console.error('❌ [COMMUNAL] Error loading gift triggers:', error);
    }
  };

  // Update objective progress
  const updateObjective = (triggerId: string, current: number) => {
    setObjectives(prev => prev.map(obj =>
      obj.triggerId === triggerId
        ? { ...obj, current: Math.min(current, obj.target) }
        : obj
    ));
  };

  // Reset all objectives
  const resetObjectives = () => {
    setObjectives(prev => prev.map(obj => ({ ...obj, current: 0 })));
    console.log('🔄 [COMMUNAL] All objectives reset');
  };

  // Get specific objective
  const getObjective = (triggerId: string): CommunalObjective | undefined => {
    return objectives.find(obj => obj.triggerId === triggerId);
  };

  // Load triggers on mount
  useEffect(() => {
    loadGiftTriggers();

    // Listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'giftTriggers') {
        loadGiftTriggers();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for backend updates via fetch polling or WebSocket
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const pollObjectiveUpdates = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/communal-objectives`);
        if (response.ok) {
          const data = await response.json();

          // Update objectives with current values from backend
          if (data.objectives) {
            setObjectives(prev => prev.map(obj => {
              const backendObj = data.objectives.find((bo: any) => bo.triggerId === obj.triggerId);
              return backendObj ? { ...obj, current: backendObj.current } : obj;
            }));
          }
        }
      } catch (error) {
        // Backend not available, silent fail
      }
    };

    // Poll every 2 seconds for updates
    pollInterval = setInterval(pollObjectiveUpdates, 2000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const value: CommunalObjectivesContextType = {
    objectives,
    updateObjective,
    resetObjectives,
    getObjective,
    loadGiftTriggers
  };

  return (
    <CommunalObjectivesContext.Provider value={value}>
      {children}
    </CommunalObjectivesContext.Provider>
  );
};

export const useCommunalObjectives = (): CommunalObjectivesContextType => {
  const context = useContext(CommunalObjectivesContext);
  if (!context) {
    throw new Error('useCommunalObjectives must be used within a CommunalObjectivesProvider');
  }
  return context;
};