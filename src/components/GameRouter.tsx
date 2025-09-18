import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import GameBoard from './GameBoard';
import AdminPanel from '../pages/AdminPanel';
import CoronasPage from '../pages/CoronasPage';
import StreamOverlay from '../pages/StreamOverlay';
import CommunalObjectiveOverlay from '../pages/CommunalObjectiveOverlay';
import AllCommunalObjectives from '../pages/AllCommunalObjectives';
import DailyRankingOverlay from '../pages/DailyRankingOverlay';
import PhraseCompletionAnimation from './PhraseCompletionAnimation';
import { SimpleGameProvider, useSimpleGame } from '../contexts/SimpleGameContext';
import { CommunalObjectivesProvider } from '../contexts/CommunalObjectivesContext';
import { simpleSync } from '../utils/simpleSync';
import { usePageZoom } from '../hooks/usePageZoom';

import '../App.css';
import '../styles/AdminPanel.css';
import '../styles/CoronasPage.css';
import '../styles/CoronasAdminPanel.css';
import '../styles/StreamOverlay.css';
import '../styles/CommunalObjectiveBar.css';

const GamePage: React.FC = () => {
  const {
    gameState,
    handleLetterReveal,
    handlePhraseComplete,
    currentWinner,
    setCurrentWinner,
    showCompletion,
    setShowCompletion
  } = useSimpleGame();
  const { zoomStyle } = usePageZoom({ pageId: 'game-page' });

  // Cambiar el fondo del body a verde croma cuando esté en la página del juego
  useEffect(() => {
    document.body.style.background = '#00ff00';
    document.body.style.backgroundImage = 'none';

    // Cleanup: restaurar el fondo original cuando se desmonte el componente
    return () => {
      document.body.style.background = '';
      document.body.style.backgroundImage = '';
    };
  }, []);

  return (
    <div className="app game-page" style={zoomStyle}>
      <main className="game-main">
        <GameBoard
          phrase={gameState.currentPhrase}
          onLetterReveal={handleLetterReveal}
          onPhraseComplete={handlePhraseComplete}
        />
      </main>

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

const AdminRoute: React.FC = () => {
  const { gameState, startNewRound, revealVowel, revealConsonant } = useSimpleGame();
  return (
    <div className="admin-route">
      <div className="back-to-game">
        <Link to="/game" className="back-link">
          <ArrowLeft size={20} />
          Volver al Juego
        </Link>
      </div>
      
      <AdminPanel
        gameState={gameState}
        onStartGame={(phraseIndex, coronaReward = 5) => startNewRound(phraseIndex, coronaReward)}
        onRevealVowel={revealVowel}
        onRevealConsonant={revealConsonant}
      />
    </div>
  );
};

const GameRouterContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CoronasPage />} />
        <Route path="/coronas" element={<CoronasPage />} />
        <Route path="/overlay" element={<StreamOverlay />} />

        {/* Test route */}
        <Route path="/test" element={<div style={{color: 'white', padding: '20px'}}>🔍 Test route working!</div>} />

        {/* Communal Objectives Overlays */}
        <Route path="/overlay/communal" element={<AllCommunalObjectives />} />
        <Route path="/overlay/communal/:triggerId" element={<CommunalObjectiveOverlay />} />

        {/* Daily Ranking Overlay */}
        <Route path="/overlay/daily-ranking" element={<DailyRankingOverlay />} />

        {/* Admin and Game routes - always available */}
        <Route path="/game" element={<GamePage />} />
        <Route path="/admin" element={<AdminRoute />} />
      </Routes>
    </Router>
  );
};

const GameRouter: React.FC = () => {
  return (
    <SimpleGameProvider>
      <CommunalObjectivesProvider>
        <GameRouterContent />
      </CommunalObjectivesProvider>
    </SimpleGameProvider>
  );
};

export default GameRouter;