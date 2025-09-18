import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CommunalObjectiveBar from '../components/CommunalObjectiveBar';
import { useCommunalObjectives } from '../contexts/CommunalObjectivesContext';
import '../styles/CommunalObjectiveBar.css';

const AllCommunalObjectives: React.FC = () => {
  const [searchParams] = useSearchParams();

  const orientation = (searchParams.get('orientation') as 'horizontal' | 'vertical') || 'horizontal';
  const background = searchParams.get('bg') || 'transparent';
  const layout = searchParams.get('layout') || 'grid'; // grid, row, column

  const { objectives } = useCommunalObjectives();

  // Add debug logging
  console.log('🔍 [AllCommunalObjectives] Component rendered');
  console.log('🔍 [AllCommunalObjectives] Objectives:', objectives);

  // Filter only enabled objectives
  const enabledObjectives = objectives.filter(obj => obj.enabled);

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

  if (enabledObjectives.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: background === 'green' ? '#00ff00' : 'rgba(0, 0, 0, 0.8)',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
        padding: '20px'
      }}>
        <div>No hay objetivos comunales activos</div>
        <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.7 }}>
          Total objetivos: {objectives.length} | Habilitados: {enabledObjectives.length}
        </div>
        <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.5 }}>
          Debug: {JSON.stringify(objectives.map(o => ({ id: o.triggerId, enabled: o.enabled })))}
        </div>
      </div>
    );
  }

  const getLayoutStyles = () => {
    const baseStyles = {
      width: '100vw',
      height: '100vh',
      background: background === 'green' ? '#00ff00' : 'transparent',
      margin: 0,
      padding: '20px',
      boxSizing: 'border-box' as const
    };

    switch (layout) {
      case 'row':
        return {
          ...baseStyles,
          display: 'flex',
          flexDirection: 'row' as const,
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap' as const
        };
      case 'column':
        return {
          ...baseStyles,
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px'
        };
      default: // grid
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: orientation === 'vertical'
            ? `repeat(auto-fit, minmax(140px, 1fr))`
            : `repeat(auto-fit, minmax(350px, 1fr))`,
          gap: '20px',
          alignItems: 'center',
          justifyItems: 'center'
        };
    }
  };

  return (
    <div
      className={`all-communal-overlay-container ${background === 'green' ? 'obs-green-screen' : 'obs-transparent'}`}
      style={getLayoutStyles()}
    >
      {enabledObjectives.map((objective) => {
        const isCompleted = objective.current >= objective.target;

        return (
          <CommunalObjectiveBar
            key={objective.triggerId}
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
        );
      })}
    </div>
  );
};

export default AllCommunalObjectives;