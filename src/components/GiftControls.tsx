import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Settings, Eye, MessageSquare, Coins, Toggle } from 'lucide-react';
import GiftSelectDropdown from './GiftSelectDropdown';
import regalosData from '../../regalos.json';
import { useSimpleGame } from '../contexts/SimpleGameContext';

interface GiftTrigger {
  id: string;
  name: string;
  giftId: number | string;
  giftName: string;
  quantity: number;
  action: 'reveal_vowel' | 'reveal_consonant' | 'purchase_vowel' | 'purchase_consonant' | 'purchase_hint';
  enabled: boolean;
}

interface GiftControlsProps {
  onTriggerChange: (triggers: GiftTrigger[]) => void;
}

const GiftControls: React.FC<GiftControlsProps> = ({ onTriggerChange }) => {
  const { revealVowel, revealConsonant, purchaseVowel, purchaseConsonant, purchaseHint } = useSimpleGame();
  // Función para cargar triggers desde localStorage
  const loadTriggersFromStorage = (): GiftTrigger[] => {
    try {
      const stored = localStorage.getItem('giftTriggers');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('🔄 [STORAGE] Triggers cargados desde localStorage:', parsed);

        // MIGRACIÓN AUTOMÁTICA: Si solo hay 5 triggers, migrar a 7 triggers
        if (parsed.length === 5) {
          console.log('🔄 [MIGRATION] Detectados 5 triggers antiguos, migrando a 7 triggers...');
          const migratedTriggers = [
            ...parsed, // Mantener los 5 triggers existentes
            {
              id: '6',
              name: 'Trigger Comunal Extra A',
              giftId: 'likes',
              giftName: 'Likes',
              quantity: 50,
              action: 'reveal_vowel',
              enabled: false
            },
            {
              id: '7',
              name: 'Trigger Comunal Extra B',
              giftId: 'follows',
              giftName: 'Follows',
              quantity: 10,
              action: 'reveal_consonant',
              enabled: false
            }
          ];

          // Guardar la configuración migrada
          localStorage.setItem('giftTriggers', JSON.stringify(migratedTriggers));
          console.log('✅ [MIGRATION] Migración completada a 7 triggers');
          return migratedTriggers;
        }

        return parsed;
      }
    } catch (error) {
      console.error('❌ [STORAGE] Error cargando triggers desde localStorage:', error);
    }

    // Triggers por defecto si no hay nada guardado (7 triggers: 5 originales + 2 comunales extra)
    return [
      {
        id: '1',
        name: 'Trigger Revelar Vocal',
        giftId: 1,
        giftName: 'Rose',
        quantity: 10,
        action: 'reveal_vowel',
        enabled: true
      },
      {
        id: '2',
        name: 'Trigger Revelar Consonante',
        giftId: 2,
        giftName: 'Perfume',
        quantity: 5,
        action: 'reveal_consonant',
        enabled: true
      },
      {
        id: '3',
        name: 'Trigger Comprar Vocal',
        giftId: 3,
        giftName: 'Love Bang',
        quantity: 1,
        action: 'purchase_vowel',
        enabled: true
      },
      {
        id: '4',
        name: 'Trigger Comprar Consonante',
        giftId: 4,
        giftName: 'TikTok',
        quantity: 1,
        action: 'purchase_consonant',
        enabled: true
      },
      {
        id: '5',
        name: 'Trigger Comprar Pista',
        giftId: 5,
        giftName: 'Galaxy',
        quantity: 1,
        action: 'purchase_hint',
        enabled: true
      },
      {
        id: '6',
        name: 'Trigger Comunal Extra A',
        giftId: 'likes',
        giftName: 'Likes',
        quantity: 50,
        action: 'reveal_vowel',
        enabled: false
      },
      {
        id: '7',
        name: 'Trigger Comunal Extra B',
        giftId: 'follows',
        giftName: 'Follows',
        quantity: 10,
        action: 'reveal_consonant',
        enabled: false
      }
    ];
  };

  // Los triggers son fijos, no se pueden agregar o eliminar
  const [triggers, setTriggers] = useState<GiftTrigger[]>(loadTriggersFromStorage);

  // Get available gifts from the real TikTok data + special options
  const availableGifts = regalosData.gifts.reduce((acc: any, gift: any) => {
    acc[gift.id.replace('gift_', '')] = {
      name: gift.name,
      coins: parseInt(gift.price),
      image: gift.image,
      index: gift.index
    };
    return acc;
  }, {
    // Add special options
    'likes': {
      name: 'Likes',
      coins: 0,
      image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><text y="30" font-size="30">❤️</text></svg>',
      index: -2
    },
    'follows': {
      name: 'Follows', 
      coins: 0,
      image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><text y="30" font-size="30">👥</text></svg>',
      index: -1
    }
  });

  // Función para guardar triggers en localStorage
  const saveTriggersToStorage = (triggersToSave: GiftTrigger[]) => {
    try {
      localStorage.setItem('giftTriggers', JSON.stringify(triggersToSave));
      console.log('💾 [STORAGE] Triggers guardados en localStorage:', triggersToSave.length, 'triggers');
    } catch (error) {
      console.error('❌ [STORAGE] Error guardando triggers en localStorage:', error);
    }
  };

  // Función para sincronizar triggers con el backend
  const syncTriggersToBackend = async (triggersToSync: GiftTrigger[]) => {
    try {
      console.log('🔄 [SYNC] Sincronizando triggers con backend:', triggersToSync);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/update-gift-triggers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ triggers: triggersToSync })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [SYNC] Triggers sincronizados con backend:', data);
      } else {
        console.error('❌ [SYNC] Error sincronizando triggers:', response.status);
      }
    } catch (error) {
      console.error('❌ [SYNC] Error de red sincronizando triggers:', error);
    }
  };

  // Triggers son fijos, no se pueden agregar nuevos

  const updateTrigger = (id: string, field: keyof GiftTrigger, value: any) => {
    const updatedTriggers = triggers.map(trigger => {
      if (trigger.id === id) {
        let updatedTrigger = { ...trigger, [field]: value };

        // Update gift name when gift ID changes
        if (field === 'giftId') {
          const searchKey = typeof value === 'string' ? value : value.toString();
          const gift = Object.entries(availableGifts).find(([giftId]) => giftId === searchKey);
          if (gift) {
            updatedTrigger.giftName = gift[1].name;
          }
        }

        return updatedTrigger;
      }
      return trigger;
    });

    setTriggers(updatedTriggers);

    // Guardar en localStorage inmediatamente
    saveTriggersToStorage(updatedTriggers);

    // Sincronizar con el backend inmediatamente
    syncTriggersToBackend(updatedTriggers);
  };

  // Función para resetear triggers a valores por defecto
  const resetTriggersToDefault = () => {
    const defaultTriggers = [
      {
        id: '1',
        name: 'Trigger Revelar Vocal',
        giftId: 1,
        giftName: 'Rose',
        quantity: 10,
        action: 'reveal_vowel' as const,
        enabled: true
      },
      {
        id: '2',
        name: 'Trigger Revelar Consonante',
        giftId: 2,
        giftName: 'Perfume',
        quantity: 5,
        action: 'reveal_consonant' as const,
        enabled: true
      },
      {
        id: '3',
        name: 'Trigger Comprar Vocal',
        giftId: 3,
        giftName: 'Love Bang',
        quantity: 1,
        action: 'purchase_vowel' as const,
        enabled: true
      },
      {
        id: '4',
        name: 'Trigger Comprar Consonante',
        giftId: 4,
        giftName: 'TikTok',
        quantity: 1,
        action: 'purchase_consonant' as const,
        enabled: true
      },
      {
        id: '5',
        name: 'Trigger Comprar Pista',
        giftId: 5,
        giftName: 'Galaxy',
        quantity: 1,
        action: 'purchase_hint' as const,
        enabled: true
      },
      {
        id: '6',
        name: 'Trigger Comunal Extra A',
        giftId: 'likes',
        giftName: 'Likes',
        quantity: 50,
        action: 'reveal_vowel' as const,
        enabled: false
      },
      {
        id: '7',
        name: 'Trigger Comunal Extra B',
        giftId: 'follows',
        giftName: 'Follows',
        quantity: 10,
        action: 'reveal_consonant' as const,
        enabled: false
      }
    ];

    setTriggers(defaultTriggers);
    saveTriggersToStorage(defaultTriggers);
    syncTriggersToBackend(defaultTriggers);
    console.log('🔄 [RESET] Triggers reseteados a valores por defecto');
  };

  // Triggers son fijos, no se pueden eliminar

  const toggleTrigger = (id: string) => {
    const currentTrigger = triggers.find(t => t.id === id);
    if (currentTrigger) {
      updateTrigger(id, 'enabled', !currentTrigger.enabled);
    }
  };

  useEffect(() => {
    onTriggerChange(triggers);
  }, [triggers, onTriggerChange]);

  // Sincronizar triggers con el backend al inicializar
  useEffect(() => {
    syncTriggersToBackend(triggers);
  }, []); // Solo al montar el componente

  // Función para simular recepción de regalo usando el endpoint del servidor
  const handleGiftReceived = async (giftId: string | number, quantity: number, username: string = 'viewer_test') => {
    try {
      console.log(`🧪 Probando trigger: ${username} envía ${quantity}x regalo ID ${giftId}`);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/test-gift-trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          giftId: giftId,
          quantity: quantity,
          username: username
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Trigger ejecutado exitosamente: ${data.message}`);
        alert(`✅ Trigger ejecutado exitosamente para ${username}!`);
      } else {
        console.error(`❌ Error ejecutando trigger: ${data.message}`);
        alert(`❌ Error ejecutando trigger: ${data.message}`);
      }
    } catch (error) {
      console.error('❌ Error conectando con servidor para trigger:', error);
      alert('❌ Error de conexión al servidor');
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'reveal_vowel':
      case 'reveal_consonant':
        return <Eye size={16} />;
      case 'purchase_vowel':
      case 'purchase_consonant':
      case 'purchase_hint':
        return <MessageSquare size={16} />;
      default:
        return <Gift size={16} />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'reveal_vowel':
      case 'purchase_vowel':
        return '#ec4899';
      case 'reveal_consonant':
      case 'purchase_consonant':
        return '#3b82f6';
      case 'purchase_hint':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="gift-controls">
      <div className="gift-controls-header">
        <h3>🎁 Configuración de Regalos (7 Triggers: 5 Originales + 2 Comunales Extra)</h3>
        <button
          onClick={() => {
            if (confirm('¿Estás seguro de que quieres resetear todos los triggers a valores por defecto?')) {
              resetTriggersToDefault();
            }
          }}
          className="reset-triggers-btn"
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
          title="Resetear triggers a valores por defecto"
        >
          🔄 Reset
        </button>
      </div>

      <div className="triggers-list">
        {triggers.map((trigger, index) => (
          <motion.div
            key={trigger.id}
            className={`trigger-card ${trigger.enabled ? 'enabled' : 'disabled'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="trigger-header">
              <div className="trigger-info">
                <div 
                  className="action-indicator"
                  style={{ color: getActionColor(trigger.action) }}
                >
                  {getActionIcon(trigger.action)}
                </div>
                <input
                  type="text"
                  value={trigger.name}
                  onChange={(e) => updateTrigger(trigger.id, 'name', e.target.value)}
                  className="trigger-name-input"
                />
              </div>
              
              <div className="trigger-controls">
                <button
                  onClick={() => toggleTrigger(trigger.id)}
                  className={`toggle-btn ${trigger.enabled ? 'on' : 'off'}`}
                >
                  {trigger.enabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="trigger-config">
              <div className="config-row">
                <div className="config-group">
                  <label>Regalo:</label>
                  <GiftSelectDropdown
                    value={trigger.giftId}
                    onChange={(value) => updateTrigger(trigger.id, 'giftId', value)}
                    className="gift-select"
                  />
                </div>

                <div className="config-group">
                  <label>Cantidad:</label>
                  <input
                    type="number"
                    min="1"
                    value={trigger.quantity}
                    onChange={(e) => updateTrigger(trigger.id, 'quantity', parseInt(e.target.value))}
                    className="quantity-input"
                  />
                </div>

                <div className="config-group">
                  <label>Acción:</label>
                  <select
                    value={trigger.action}
                    onChange={(e) => updateTrigger(trigger.id, 'action', e.target.value)}
                    className="action-select"
                  >
                    <option value="reveal_vowel">Revelar Vocal</option>
                    <option value="reveal_consonant">Revelar Consonante</option>
                    <option value="purchase_vowel">Comprar Vocal</option>
                    <option value="purchase_consonant">Comprar Consonante</option>
                    <option value="purchase_hint">Comprar Pista</option>
                  </select>
                </div>
              </div>

              <div className="trigger-preview">
                <span className="preview-text">
                  Cuando se reciban <strong>{trigger.quantity}</strong> x{' '}
                  <strong>{trigger.giftName}</strong> ({
                    (() => {
                      const searchKey = typeof trigger.giftId === 'string' ? trigger.giftId : trigger.giftId.toString();
                      const coins = availableGifts[searchKey]?.coins || 0;
                      return coins === 0 ? 'Gratis' : `${coins} coins`;
                    })()
                  }) →{' '}
                  <span style={{ color: getActionColor(trigger.action) }}>
                    {trigger.action === 'reveal_vowel' && 'Revelar Vocal'}
                    {trigger.action === 'reveal_consonant' && 'Revelar Consonante'}
                    {trigger.action === 'purchase_vowel' && 'Enviar Vocal al Inbox'}
                    {trigger.action === 'purchase_consonant' && 'Enviar Consonante al Inbox'}
                    {trigger.action === 'purchase_hint' && 'Enviar Pista al Inbox'}
                  </span>
                </span>
              </div>

              {/* Manual Trigger Test Button */}
              <div className="manual-trigger-test">
                <button
                  onClick={() => {
                    // Triggers comunales (reveal_*) usan usuario genérico
                    // Triggers privados (purchase_*) necesitan usuario específico para pruebas end-to-end
                    const isCommunal = trigger.action.startsWith('reveal_');
                    const testUsername = isCommunal ? 'comunal_trigger' : 'oraculo_vidente';
                    handleGiftReceived(trigger.giftId, trigger.quantity, testUsername);
                  }}
                  disabled={!trigger.enabled}
                  className="manual-test-btn"
                  title={`Ejecutar trigger ${trigger.action.startsWith('reveal_') ? 'comunal' : 'privado'} manualmente para pruebas`}
                  style={{
                    backgroundColor: trigger.enabled ? getActionColor(trigger.action) : '#6b7280',
                    opacity: trigger.enabled ? 1 : 0.5
                  }}
                >
                  🧪 {trigger.action.startsWith('reveal_') ? 'Comunal' : 'Privado'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Los 7 triggers siempre están presentes: 5 originales + 2 comunales extra */}
    </div>
  );
};

export default GiftControls;