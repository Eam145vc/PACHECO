import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Eye, ExternalLink, Check } from 'lucide-react';
import { useCommunalObjectives } from '../contexts/CommunalObjectivesContext';
import { useGiftData } from '../hooks/useGiftData';

const CommunalOverlayLinks: React.FC = () => {
  const { objectives } = useCommunalObjectives();
  const { getGiftName } = useGiftData();
  const [copiedLinks, setCopiedLinks] = useState<string[]>([]);

  // Get current hostname and port
  const baseUrl = window.location.origin;

  // Filter enabled communal objectives
  const enabledObjectives = objectives.filter(obj => obj.enabled);

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLinks(prev => [...prev, linkId]);
      setTimeout(() => {
        setCopiedLinks(prev => prev.filter(id => id !== linkId));
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const linkVariations = [
    {
      name: 'Horizontal Transparente',
      params: '?orientation=horizontal&bg=transparent'
    },
    {
      name: 'Horizontal Verde (OBS)',
      params: '?orientation=horizontal&bg=green'
    },
    {
      name: 'Vertical Transparente',
      params: '?orientation=vertical&bg=transparent'
    },
    {
      name: 'Vertical Verde (OBS)',
      params: '?orientation=vertical&bg=green'
    }
  ];

  if (enabledObjectives.length === 0) {
    return (
      <div className="communal-overlay-links">
        <h3>🎯 Links de Overlay - Objetivos Comunales</h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic' }}>
          No hay objetivos comunales habilitados. Habilita algunos triggers comunales (likes/follows) en la configuración de arriba.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="communal-overlay-links"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        padding: '20px',
        margin: '20px 0'
      }}
    >
      <h3 style={{
        color: '#ffffff',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        🎯 Links de Overlay - Objetivos Comunales
        <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
          ({enabledObjectives.length} activos)
        </span>
      </h3>

      {/* All Objectives Combined */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ color: '#4ade80', marginBottom: '12px', fontSize: '14px' }}>
          📊 Todos los Objetivos Juntos
        </h4>
        <div style={{ display: 'grid', gap: '8px' }}>
          {linkVariations.map((variation, index) => {
            const url = `${baseUrl}/overlay/communal${variation.params}`;
            const linkId = `all-${index}`;
            const isCopied = copiedLinks.includes(linkId);

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <span style={{
                  fontSize: '12px',
                  color: '#ffffff',
                  minWidth: '140px'
                }}>
                  {variation.name}:
                </span>
                <input
                  type="text"
                  value={url}
                  readOnly
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  onClick={() => copyToClipboard(url, linkId)}
                  style={{
                    background: isCopied ? '#22c55e' : '#3b82f6',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px'
                  }}
                >
                  {isCopied ? <Check size={12} /> : <Copy size={12} />}
                  {isCopied ? 'Copiado' : 'Copiar'}
                </button>
                <button
                  onClick={() => openInNewTab(url)}
                  style={{
                    background: '#8b5cf6',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ExternalLink size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Objectives */}
      <div>
        <h4 style={{ color: '#ec4899', marginBottom: '12px', fontSize: '14px' }}>
          🎯 Objetivos Individuales
        </h4>
        {enabledObjectives.map((objective) => (
          <motion.div
            key={objective.triggerId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              marginBottom: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '12px'
            }}
          >
            <div style={{
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#ffffff'
            }}>
              {objective.triggerName} ({getGiftName(objective.giftId)})
            </div>

            <div style={{ display: 'grid', gap: '6px' }}>
              {linkVariations.map((variation, index) => {
                const url = `${baseUrl}/overlay/communal/${objective.triggerId}${variation.params}`;
                const linkId = `${objective.triggerId}-${index}`;
                const isCopied = copiedLinks.includes(linkId);

                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '6px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    <span style={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      minWidth: '120px'
                    }}>
                      {variation.name}:
                    </span>
                    <input
                      type="text"
                      value={url}
                      readOnly
                      style={{
                        flex: 1,
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '3px',
                        padding: '3px 6px',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <button
                      onClick={() => copyToClipboard(url, linkId)}
                      style={{
                        background: isCopied ? '#22c55e' : '#3b82f6',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '3px 6px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '10px'
                      }}
                    >
                      {isCopied ? <Check size={10} /> : <Copy size={10} />}
                    </button>
                    <button
                      onClick={() => openInNewTab(url)}
                      style={{
                        background: '#8b5cf6',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '3px 6px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Eye size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.9)'
      }}>
        <strong>💡 Instrucciones para OBS:</strong>
        <ul style={{ margin: '8px 0 0 16px', lineHeight: '1.4' }}>
          <li>Links <strong>Transparente</strong>: Fondo transparente para overlays</li>
          <li>Links <strong>Verde (OBS)</strong>: Fondo verde croma (#00ff00) para key chroma</li>
          <li><strong>Horizontal</strong>: Barras anchas para parte superior/inferior</li>
          <li><strong>Vertical</strong>: Barras altas para laterales</li>
          <li>Los objetivos se actualizan en tiempo real</li>
          <li>Se reinician automáticamente al completarse o resetear el board</li>
        </ul>
      </div>
    </motion.div>
  );
};

export default CommunalOverlayLinks;