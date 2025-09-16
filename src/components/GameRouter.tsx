import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import GameBoard from './GameBoard';
import AdminPanel from '../pages/AdminPanel';
import CoronasPage from '../pages/CoronasPage';
import StreamOverlay from '../pages/StreamOverlay';
import CommunalObjectiveOverlay from '../pages/CommunalObjectiveOverlay';
import AllCommunalObjectives from '../pages/AllCommunalObjectives';
import { SimpleGameProvider, useSimpleGame } from '../contexts/SimpleGameContext';
import { CommunalObjectivesProvider } from '../contexts/CommunalObjectivesContext';
import { simpleSync } from '../utils/simpleSync';

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
  } = useSimpleGame();

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
    <div className="app game-page">
      <main className="game-main">
        <GameBoard
          phrase={gameState.currentPhrase}
          onLetterReveal={handleLetterReveal}
          onPhraseComplete={handlePhraseComplete}
        />
      </main>
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
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return (
    <Router>
      <Routes>
        <Route path="/" element={<CoronasPage />} />
        <Route path="/coronas" element={<CoronasPage />} />
        <Route path="/overlay" element={<StreamOverlay />} />

        {/* Communal Objectives Overlays */}
        <Route path="/overlay/communal" element={<AllCommunalObjectives />} />
        <Route path="/overlay/communal/:triggerId" element={<CommunalObjectiveOverlay />} />

        {isLocal && (
          <>
            <Route path="/game" element={<GamePage />} />
            <Route path="/admin" element={<AdminRoute />} />
          </>
        )}
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