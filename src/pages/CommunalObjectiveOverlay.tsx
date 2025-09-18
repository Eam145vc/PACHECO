import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import CommunalObjectiveBar from '../components/CommunalObjectiveBar';
import { useCommunalObjectives } from '../contexts/CommunalObjectivesContext';
import { usePageZoom } from '../hooks/usePageZoom';
import '../styles/CommunalObjectiveBar.css';

const CommunalObjectiveOverlay: React.FC = () => {
  const { triggerId } = useParams<{ triggerId: string }>();
  const [searchParams] = useSearchParams();
  const { zoomStyle } = usePageZoom({ pageId: 'communal-objective-overlay' });

  const orientation = (searchParams.get('orientation') as 'horizontal' | 'vertical') || 'horizontal';
  const background = searchParams.get('bg') || 'transparent';

  const { objectives, getObjective } = useCommunalObjectives();

  // Find the specific objective
  const objective = triggerId ? getObjective(triggerId) : null;

  useEffect(() => {
    // Set body background based on URL parameter
    if (background === 'green') {
      document.body.style.background = '#00ff00';
      document.body.style.backgroundImage = 'none';
    } else {
      document.body.style.background = 'transparent';
      document.body.style.backgroundImage = 'none';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.background = '';
      document.body.style.backgroundImage = '';
    };
  }, [background]);

  if (!objective) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: background === 'green' ? '#00ff00' : 'transparent',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)'
      }}>
        {triggerId ? `Objetivo "${triggerId}" no encontrado` : 'Objetivo no especificado'}
      </div>
    );
  }

  const isCompleted = objective.current >= objective.target;

  return (
    <div
      className={`communal-overlay-container ${background === 'green' ? 'obs-green-screen' : 'obs-transparent'}`}
      style={{
        ...zoomStyle,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: background === 'green' ? '#00ff00' : 'transparent',
        margin: 0,
        padding: 0
      }}
    >
      <CommunalObjectiveBar
        triggerId={objective.triggerId}
        triggerName={objective.triggerName}
        giftId={objective.giftId}
        giftName={objective.giftName}
        current={objective.current}
        target={objective.target}
        orientation={orientation}
        isCompleted={isCompleted}
        giftImage={objective.giftImage}
        overlayTitle={objective.overlayTitle}
      />
    </div>
  );
};

export default CommunalObjectiveOverlay;