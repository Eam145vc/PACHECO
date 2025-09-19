import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Play,
  Pause,
  Users,
  Coins,
  Crown,
  MessageCircle,
  Activity,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  RefreshCw,
  Save,
  Trash2,
  Trophy
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { GameState } from '../types/game';
import { createPhraseFromText } from '../utils/gameUtils';
import GiftControls from '../components/GiftControls';
import SmartPhraseGenerator from '../components/SmartPhraseGenerator';
import CommunalOverlayLinks from '../components/CommunalOverlayLinks';
import { useSimpleGame } from '../contexts/SimpleGameContext';
import { tiktokBotService } from '../services/tiktokBotService';
import CoronasAdminContent from '../components/CoronasAdminContent';
import TikTokLiveHeader from '../components/TikTokLiveHeader';
import { usePageZoom } from '../hooks/usePageZoom';

interface AdminPanelProps {
  gameState: GameState;
  onStartGame: (phraseIndex: number, coronaReward?: number) => void;
  onRevealVowel: () => void;
  onRevealConsonant: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  gameState,
  onStartGame,
  onRevealVowel,
  onRevealConsonant
}) => {
  const { zoomStyle } = usePageZoom({ pageId: 'admin-panel' });
  const {
    availablePhrases,
    addCustomPhrase,
    purchaseVowel,
    purchaseConsonant,
    purchaseHint,
    streamerUsername,
    setStreamerUsername,
    botConnected,
    setBotConnected,
    resetBoard,
    currentPhraseHints,
    removePhrase
  } = useSimpleGame();
  const [activeTab, setActiveTab] = useState('game-control');
  const [autoReveal, setAutoReveal] = useState({
    enabled: false,
    interval: 30,
    vowelThreshold: 50,
    consonantThreshold: 25
  });
  
  const [giftTriggers, setGiftTriggers] = useState<any[]>([]);
  
  const [gameConfig, setGameConfig] = useState({
    tokensPerWinner: 100,
    maxWinners: 3,
    roundDuration: 5,
    phrasesPerRound: 1
  });

  const [phraseCoronas, setPhraseCoronas] = useState<{[key: number]: number}>({});

  const [liveStats, setLiveStats] = useState({
    viewers: 2847,
    likes: 1523,
    follows: 89,
    comments: 456,
    gifts: 234
  });

  // Use phrases from context instead of local state

  const [newPhrase, setNewPhrase] = useState({
    text: '',
    category: '',
    difficulty: 'medio' as const,
    coronaReward: 5
  });


  // Mock live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        ...prev,
        viewers: prev.viewers + Math.floor(Math.random() * 20) - 10,
        likes: prev.likes + Math.floor(Math.random() * 10),
        follows: prev.follows + Math.floor(Math.random() * 3),
        comments: prev.comments + Math.floor(Math.random() * 5),
        gifts: prev.gifts + Math.floor(Math.random() * 2)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleAddPhrase = () => {
    if (newPhrase.text && newPhrase.category) {
      addCustomPhrase({ ...newPhrase });
      setNewPhrase({ text: '', category: '', difficulty: 'medio', coronaReward: 5 });
    }
  };

  const handleStartGameWithCoronas = (phraseIndex: number) => {
    const coronas = phraseCoronas[phraseIndex] || availablePhrases[phraseIndex]?.coronaReward || 5;
    onStartGame(phraseIndex, coronas);
  };

  const updatePhraseCoronas = (phraseIndex: number, coronas: number) => {
    setPhraseCoronas(prev => ({
      ...prev,
      [phraseIndex]: coronas
    }));
  };

  const handleSaveConfig = () => {
    console.log('Config saved:', gameConfig);
    // Here you would save to backend/localStorage
  };

  const handleDeletePhrase = (index: number, phrase: any) => {
    if (!confirm(`¿Estás seguro de eliminar la frase "${phrase.text}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    if (removePhrase) {
      removePhrase(index);
      // También eliminar las coronas asociadas
      setPhraseCoronas(prev => {
        const newCoronas = { ...prev };
        delete newCoronas[index];
        // Reajustar índices para las frases restantes
        const adjustedCoronas: {[key: number]: number} = {};
        Object.keys(newCoronas).forEach(key => {
          const numKey = parseInt(key);
          if (numKey > index) {
            adjustedCoronas[numKey - 1] = newCoronas[numKey];
          } else {
            adjustedCoronas[numKey] = newCoronas[numKey];
          }
        });
        return adjustedCoronas;
      });
    }
  };

  const handleGiftTriggersChange = (triggers: any[]) => {
    setGiftTriggers(triggers);
    console.log('Gift triggers updated:', triggers);
  };

  const handleResetDailyRanking = async () => {
    if (!confirm('¿Estás seguro de resetear el ranking diario? Esta acción marcará todas las transacciones del día como reset.')) return;

    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/api/reset-daily-ranking`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('Ranking diario reseteado exitosamente');
      } else {
        alert('Error al resetear ranking diario: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error resetting daily ranking:', error);
      alert('Error al resetear ranking diario');
    }
  };

  const tabs = [
    { id: 'game-control', name: 'Control del Juego', icon: Play },
    { id: 'phrases', name: 'Gestión de Frases', icon: MessageCircle },
    { id: 'coronas', name: 'Sistema de Coronas', icon: Crown },
    { id: 'tiktok-bot', name: 'TikTok Bot', icon: MessageCircle }
  ];

  return (
    <div className="admin-panel" style={zoomStyle}>
      <motion.header
        className="admin-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="admin-logo">
          <h1>🎮 Panel de Control</h1>
        </div>
        <div className="admin-status">
          <div className={`status-indicator ${gameState.isGameActive ? 'active' : 'inactive'}`}>
            {gameState.isGameActive ? 'JUEGO ACTIVO' : 'JUEGO PAUSADO'}
          </div>
          <div className="round-indicator">
            Ronda: {gameState.roundNumber}
          </div>
        </div>
      </motion.header>

      {/* TikTok Live Header */}
      <TikTokLiveHeader />

      <div className="admin-layout">
        <motion.nav 
          className="admin-sidebar"
          initial={{ x: -200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <tab.icon size={20} />
              {tab.name}
            </motion.button>
          ))}
        </motion.nav>

        <motion.main 
          className="admin-content"
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {activeTab === 'game-control' && (
            <div className="tab-content">
              <h2>🎯 Control del Juego</h2>
              
              <div className="control-grid">
                <div className="control-section">
                  <h3>Iniciar Juegos con Coronas</h3>
                  <div className="phrase-buttons">
                    {availablePhrases.map((phrase, index) => {
                      const currentCoronas = phraseCoronas[index] || phrase.coronaReward;
                      return (
                        <div key={index} className="phrase-item">
                          <div className="phrase-header">
                            <span className="phrase-text">{phrase.text}</span>
                            <span className="phrase-meta">{phrase.category} • {phrase.difficulty}</span>
                          </div>
                          <div className="phrase-controls">
                            <div className="corona-control">
                              <label>👑 Coronas:</label>
                              <input
                                type="number"
                                value={currentCoronas}
                                onChange={(e) => updatePhraseCoronas(index, parseInt(e.target.value) || 1)}
                                min="1"
                                max="100"
                                className="corona-input-inline"
                              />
                            </div>
                            <div className="phrase-actions">
                              <button
                                onClick={() => handleStartGameWithCoronas(index)}
                                className="start-phrase-btn"
                                disabled={gameState.isGameActive}
                              >
                                🎯 Iniciar por {currentCoronas} 👑
                              </button>
                              <button
                                onClick={() => handleDeletePhrase(index, phrase)}
                                className="delete-phrase-btn"
                                title="Eliminar frase"
                              >
                                <Trash2 size={16} />
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="control-section">
                  <h3>Revelar Letras</h3>
                  <div className="reveal-controls">
                    <button
                      onClick={onRevealVowel}
                      disabled={!gameState.isGameActive}
                      className="control-btn vowel-btn"
                    >
                      <Eye size={20} />
                      Revelar Vocal
                    </button>
                    <button
                      onClick={onRevealConsonant}
                      disabled={!gameState.isGameActive}
                      className="control-btn consonant-btn"
                    >
                      <Eye size={20} />
                      Revelar Consonante
                    </button>
                  </div>
                </div>

                {/* Sección de Pistas */}
                {gameState.isGameActive && currentPhraseHints.length > 0 && (
                  <div className="control-section">
                    <h3>💡 Pistas del Juego Actual</h3>
                    <div className="hints-display">
                      {currentPhraseHints.map((hint, index) => (
                        <div key={index} className="hint-card" style={{
                          backgroundColor: '#e8f4fd',
                          border: '1px solid #bee5eb',
                          borderRadius: '8px',
                          padding: '10px',
                          margin: '5px 0',
                          display: 'flex',
                          alignItems: 'flex-start'
                        }}>
                          <span style={{
                            fontWeight: 'bold',
                            color: '#0c5460',
                            minWidth: '30px',
                            fontSize: '14px'
                          }}>
                            {index + 1}.
                          </span>
                          <span style={{
                            color: '#0c5460',
                            fontSize: '14px',
                            lineHeight: '1.4'
                          }}>
                            {hint}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="control-section">
                  <h3>Control del Tablero</h3>
                  <div className="board-controls">
                    <button
                      onClick={() => {
                        if (confirm('¿Estás seguro de que quieres resetear el tablero?')) {
                          resetBoard();
                          alert('Tablero reseteado.');
                        }
                      }}
                      className="control-btn reset-btn"
                    >
                      <RefreshCw size={20} />
                      Resetear Tablero
                    </button>
                    <button
                      onClick={handleResetDailyRanking}
                      className="control-btn warning-btn"
                      title="Resetear el ranking diario"
                    >
                      <Trophy size={20} />
                      Resetear Ranking Diario
                    </button>
                  </div>
                </div>


                <GiftControls onTriggerChange={handleGiftTriggersChange} />

                <CommunalOverlayLinks />
              </div>
            </div>
          )}

          {activeTab === 'phrases' && (
            <div className="tab-content">
              <h2>📝 Gestión de Frases</h2>
              
              <div className="phrase-manager">
                <SmartPhraseGenerator 
                  onPhraseGenerated={(phrase) => {
                    const difficultyMap = {
                      easy: 'fácil',
                      medium: 'medio',
                      hard: 'difícil'
                    };
                    addCustomPhrase({
                      ...phrase,
                      difficulty: difficultyMap[phrase.difficulty] as 'fácil' | 'medio' | 'difícil',
                      coronaReward: 5 // Default corona reward
                    });
                  }}
                />

                <div className="add-phrase-form">
                  <h3>Agregar Nueva Frase Manualmente</h3>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Frase (ej: HELLO WORLD)"
                      value={newPhrase.text}
                      onChange={(e) => setNewPhrase({...newPhrase, text: e.target.value.toUpperCase()})}
                    />
                    <input
                      type="text"
                      placeholder="Categoría"
                      value={newPhrase.category}
                      onChange={(e) => setNewPhrase({...newPhrase, category: e.target.value})}
                    />
                    <select
                      value={newPhrase.difficulty}
                      onChange={(e) => setNewPhrase({...newPhrase, difficulty: e.target.value as any})}
                    >
                      <option value="fácil">Fácil</option>
                      <option value="medio">Medio</option>
                      <option value="difícil">Difícil</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Coronas"
                      value={newPhrase.coronaReward}
                      onChange={(e) => setNewPhrase({...newPhrase, coronaReward: parseInt(e.target.value) || 1})}
                      min="1"
                      max="50"
                      className="corona-input-small"
                    />
                    <button onClick={handleAddPhrase} className="add-btn">
                      Agregar
                    </button>
                  </div>
                </div>

                <div className="phrases-list">
                  <h3>Frases Disponibles</h3>
                  {availablePhrases.map((phrase, index) => (
                    <div key={index} className="phrase-item">
                      <div className="phrase-info">
                        <span className="phrase-text">{phrase.text}</span>
                        <span className="phrase-meta">{phrase.category} • {phrase.difficulty}</span>
                      </div>
                      <button 
                        onClick={() => onStartGame(index)}
                        className="start-btn"
                        disabled={gameState.isGameActive}
                      >
                        <Play size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {activeTab === 'coronas' && (
            <div className="tab-content">
              <h2>👑 Sistema de Coronas</h2>
              <CoronasAdminContent />
            </div>
          )}

          {activeTab === 'tiktok-bot' && (
            <div className="tab-content">
              <h2>🤖 TikTok Bot</h2>
              
              <div className="bot-manager">
                <div className="bot-status">
                  <h3>Estado de Conexión</h3>
                  <div className={`connection-indicator ${botConnected ? 'connected' : 'disconnected'}`}>
                    <div className="status-dot"></div>
                    {botConnected ? 'Conectado' : 'Desconectado'}
                  </div>
                </div>

                <div className="bot-config">
                  <h3>Configuración de Cookies</h3>
                  <div className="config-row">
                    <div className="config-group">
                      <label>Cookies de TikTok (JSON):</label>
                      <textarea 
                        rows={6}
                        placeholder='[{"name": "sessionid", "value": "...", "domain": ".tiktok.com"}]'
                        className="cookies-textarea"
                        defaultValue={JSON.stringify([
                          {"name": "sessionid", "value": "10aebceb078e76f4a89c67093f2421ed", "domain": ".tiktok.com"},
                          {"name": "tt_csrf_token", "value": "q7QxSTHM-fykQRaMMac_amnkG44fYHlbmDW4", "domain": ".tiktok.com"},
                          {"name": "ttwid", "value": "1%7CatWrItivAVBwkAvdno-GcEHfLE-03SQ0i_vdyEH-Tx8%7C1757606365%7C6770a934734c021ae5e5fb8f982b5b31f5bb6475ce1b8f2247a60d6780ac5704", "domain": ".tiktok.com"},
                          {"name": "msToken", "value": "nIIbdRqE82WwXU9M3z_UGfvwWL5kThGg644xy7ArDDw5eJD5Yw7CC3sZoECYBC44dlVrmwxxk_gG-sA8zuVakXz0elZ1uQWJPs-J5bcgJ5g5clm2PYAv5I5VOD582-B_20SnBWC4d7S6bAtgHzE9CRN2", "domain": ".tiktok.com"}
                        ], null, 2)}
                      />
                    </div>
                  </div>
                  
                  <div className="bot-actions">
                    <button
                      onClick={async () => {
                        try {
                          const response = await tiktokBotService.startBrowser();
                          setBotConnected(response.success);
                        } catch (error) {
                          setBotConnected(false);
                        }
                      }}
                      className="bot-btn start-btn"
                    >
                      Iniciar Navegador TikTok
                    </button>
                    
                    <button
                      onClick={async () => {
                        const textarea = document.querySelector('.cookies-textarea') as HTMLTextAreaElement;
                        if (textarea?.value) {
                          try {
                            const cookies = JSON.parse(textarea.value);
                            const response = await tiktokBotService.setCookies(cookies);
                            if (response.success) {
                              alert('Cookies actualizadas correctamente');
                            } else {
                              alert('Error al actualizar cookies: ' + response.error);
                            }
                          } catch (error) {
                            alert('Error: JSON de cookies inválido');
                          }
                        }
                      }}
                      className="bot-btn update-cookies-btn"
                    >
                      Actualizar Cookies
                    </button>
                  </div>
                </div>

                <div className="bot-test">
                  <h3>Pruebas</h3>
                  <div className="test-buttons">
                    <button
                      onClick={() => purchaseVowel('usuario_test')}
                      disabled={!gameState.isGameActive}
                      className="test-btn vowel"
                    >
                      🔤 Probar Vocal
                    </button>
                    <button
                      onClick={() => purchaseConsonant('usuario_test')}
                      disabled={!gameState.isGameActive}
                      className="test-btn consonant"
                    >
                      🔠 Probar Consonante
                    </button>
                    <button
                      onClick={() => purchaseHint('usuario_test')}
                      disabled={!gameState.isGameActive}
                      className="test-btn hint"
                    >
                      💡 Probar Pista
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}



        </motion.main>
      </div>
    </div>
  );
};

export default AdminPanel;