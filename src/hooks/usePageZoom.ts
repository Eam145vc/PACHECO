import { useState, useEffect } from 'react';

interface UsePageZoomProps {
  pageId: string;
  defaultZoom?: number;
}

export const usePageZoom = ({ pageId, defaultZoom = 1 }: UsePageZoomProps) => {
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem(`page-zoom-${pageId}`);
    return saved ? parseFloat(saved) : defaultZoom;
  });

  useEffect(() => {
    localStorage.setItem(`page-zoom-${pageId}`, zoom.toString());
  }, [pageId, zoom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoom(prev => Math.min(prev + 0.1, 3));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoom(prev => Math.max(prev - 0.1, 0.3));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(1);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.3, Math.min(3, prev + delta)));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const zoomStyle = {
    transform: `scale(${zoom})`,
    transformOrigin: 'top left',
    width: `${100 / zoom}%`,
    height: `${100 / zoom}%`
  };

  return { zoom, setZoom, zoomStyle };
};