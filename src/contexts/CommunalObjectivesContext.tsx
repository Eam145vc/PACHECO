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
  overlayTitle?: string;
}

interface CommunalObjectivesContextType {
  objectives: CommunalObjective[];
  updateObjective: (triggerId: string, current: number) => void;
  resetObjectives: () => void;
  getObjective: (triggerId: string) => CommunalObjective | undefined;
  loadGiftTriggers: () => Promise<void>;
}

const CommunalObjectivesContext = createContext<CommunalObjectivesContextType | undefined>(undefined);

interface CommunalObjectivesProviderProps {
  children: ReactNode;
}

export const CommunalObjectivesProvider: React.FC<CommunalObjectivesProviderProps> = ({ children }) => {
  const [objectives, setObjectives] = useState<CommunalObjective[]>([]);
  const { getGiftImage, getGiftName } = useGiftData();

  // Load gift triggers from server first, fallback to localStorage
  const loadGiftTriggers = async () => {
    console.log('🌐 [COMMUNAL] Intentando cargar triggers desde servidor...');

    // First try to load from server
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/gift-triggers`);
      if (response.ok) {
        const data = await response.json();
        console.log('📡 [COMMUNAL] Respuesta del servidor:', data);

        if (data.triggers && Array.isArray(data.triggers)) {
          const triggers = data.triggers;
          console.log('✅ [COMMUNAL] Triggers cargados desde servidor:', triggers);
          processTriggers(triggers);
          return; // Exit early since we loaded from server
        }
      }
    } catch (error) {
      console.error('❌ [COMMUNAL] Error cargando desde servidor:', error);
    }

    // Fallback to localStorage
    console.log('💾 [COMMUNAL] Fallback a localStorage...');
    try {
      const stored = localStorage.getItem('giftTriggers');
      if (stored) {
        const triggers = JSON.parse(stored);
        console.log('📱 [COMMUNAL] Triggers cargados desde localStorage:', triggers);
        processTriggers(triggers);
      } else {
        console.log('❌ [COMMUNAL] No hay triggers en localStorage');
        setObjectives([]); // Set empty array if no triggers found
      }
    } catch (error) {
      console.error('❌ [COMMUNAL] Error loading gift triggers from localStorage:', error);
    }
  };

  // Helper function to process triggers from any source
  const processTriggers = (triggers: any[]) => {
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
      action: trigger.action,
      overlayTitle: trigger.overlayTitle || trigger.name // Use overlayTitle or fall back to trigger name
    }));

    setObjectives(newObjectives);
    console.log('🎯 [COMMUNAL] Objetivos comunales procesados:', newObjectives);
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
    loadGiftTriggers(); // Now async but we don't need to await in useEffect

    // Listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'giftTriggers') {
        loadGiftTriggers(); // Reload when localStorage changes
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for backend updates via fetch polling or WebSocket
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let triggersHash = '';

    const pollObjectiveUpdates = async () => {
      try {
        // Always use relative path to leverage Vite proxy
        const response = await fetch('/communal-objectives');
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

    // NUEVO: Polling para detectar cambios en triggers configuration
    const pollTriggerChanges = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/gift-triggers`);
        if (response.ok) {
          const data = await response.json();
          if (data.triggers && Array.isArray(data.triggers)) {
            // Create hash of triggers to detect changes
            const newTriggersHash = JSON.stringify(data.triggers.map(t => ({
              id: t.id,
              enabled: t.enabled,
              action: t.action,
              quantity: t.quantity,
              name: t.name,
              overlayTitle: t.overlayTitle
            })));

            // If triggers configuration changed, reload them
            if (triggersHash && triggersHash !== newTriggersHash) {
              console.log('🔄 [COMMUNAL] Triggers configuration changed, reloading...');
              console.log('🔄 [COMMUNAL] Old hash:', triggersHash.substring(0, 50) + '...');
              console.log('🔄 [COMMUNAL] New hash:', newTriggersHash.substring(0, 50) + '...');
              processTriggers(data.triggers);
            }

            triggersHash = newTriggersHash;
          }
        }
      } catch (error) {
        // Server not available, silent fail
      }
    };

    // Poll every 2 seconds for counter updates and trigger changes
    pollInterval = setInterval(() => {
      pollObjectiveUpdates();
      pollTriggerChanges();
    }, 2000);

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