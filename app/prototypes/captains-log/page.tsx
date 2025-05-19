"use client";

// Template for creating a new prototype
// To use this template:
// 1. Create a new folder in app/prototypes with your prototype name
// 2. Copy this file and styles.module.css into your new folder
// 3. Create an 'images' folder for your prototype's images
// 4. Rename and customize the component and styles as needed

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import styles from './styles.module.css';
import DrawingCanvas from './components/DrawingCanvas';

interface Window {
  id: string;
  type: 'text' | 'drawing';
  title: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  innerWidth?: number;
  innerHeight?: number;
  isResizing?: boolean;
}

export default function CaptainsLog() {
  const [windows, setWindows] = useState<Window[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(1);
  const dragRef = useRef<{ startX: number; startY: number; isDragging: boolean }>({
    startX: 0,
    startY: 0,
    isDragging: false
  });
  const windowRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    isResizing: boolean;
    windowId: string | null;
  }>({
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    isResizing: false,
    windowId: null
  });

  useEffect(() => {
    // Load saved windows from localStorage
    const savedWindows = localStorage.getItem('captainsLogWindows');
    if (savedWindows) {
      setWindows(JSON.parse(savedWindows));
    }
  }, []);

  useEffect(() => {
    // Save windows to localStorage whenever they change
    if (windows.length > 0) {
      localStorage.setItem('captainsLogWindows', JSON.stringify(windows));
    }
  }, [windows]);

  useEffect(() => {
    const observers: { [key: string]: ResizeObserver } = {};

    windows.forEach(window => {
      const element = windowRefs.current[window.id];
      if (!element) return;

      const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setWindows(prev => prev.map(w =>
            w.id === window.id ? { ...w, innerWidth: width, innerHeight: height } : w
          ));
        }
      });

      observer.observe(element);
      observers[window.id] = observer;
    });

    return () => {
      Object.values(observers).forEach(observer => observer.disconnect());
    };
  }, [windows.length]);

  const createNewWindow = (type: 'text' | 'drawing') => {
    const newWindow: Window = {
      id: `window-${Date.now()}`,
      type,
      title: type === 'text' ? 'New Log Entry' : 'New Sketch',
      content: '',
      position: { x: 50 + (windows.length * 30), y: 50 + (windows.length * 30) },
      size: { 
        width: type === 'drawing' ? 600 : 400, 
        height: type === 'drawing' ? 500 : 300 
      },
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex
    };

    setWindows(prev => [...prev, newWindow]);
    setNextZIndex(prev => prev + 1);
    setActiveWindowId(newWindow.id);
  };

  const handleWindowClick = (windowId: string) => {
    if (windowId === activeWindowId) return;
    
    setWindows(prev => prev.map(window => ({
      ...window,
      zIndex: window.id === windowId ? nextZIndex : window.zIndex
    })));
    setNextZIndex(prev => prev + 1);
    setActiveWindowId(windowId);
  };

  const startDragging = (e: React.MouseEvent, windowId: string) => {
    const window = windows.find(w => w.id === windowId);
    if (!window || window.isMaximized) return;

    dragRef.current = {
      startX: e.clientX - window.position.x,
      startY: e.clientY - window.position.y,
      isDragging: true
    };
    
    handleWindowClick(windowId);

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.isDragging) return;

      const newX = e.clientX - dragRef.current.startX;
      const newY = e.clientY - dragRef.current.startY;

      setWindows(prev => prev.map(window => 
        window.id === windowId
          ? { ...window, position: { x: newX, y: newY } }
          : window
      ));
    };

    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleMinimize = (windowId: string) => {
    setWindows(prev => prev.map(window => 
      window.id === windowId
        ? { ...window, isMinimized: !window.isMinimized, isMaximized: false }
        : window
    ));
  };

  const toggleMaximize = (windowId: string) => {
    setWindows(prev => prev.map(window => 
      window.id === windowId
        ? { ...window, isMaximized: !window.isMaximized, isMinimized: false }
        : window
    ));
  };

  const closeWindow = (windowId: string) => {
    setWindows(prev => prev.filter(window => window.id !== windowId));
    if (activeWindowId === windowId) {
      setActiveWindowId(null);
    }
  };

  const startResizing = (e: React.MouseEvent, windowId: string) => {
    e.stopPropagation();
    const window = windows.find(w => w.id === windowId);
    if (!window || window.isMaximized) return;

    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: window.size.width,
      startHeight: window.size.height,
      isResizing: true,
      windowId
    };

    handleWindowClick(windowId);

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current.isResizing) return;

      const deltaX = e.clientX - resizeRef.current.startX;
      const deltaY = e.clientY - resizeRef.current.startY;

      const newWidth = Math.max(300, resizeRef.current.startWidth + deltaX);
      const newHeight = Math.max(200, resizeRef.current.startHeight + deltaY);

      setWindows(prev => prev.map(window =>
        window.id === windowId
          ? { ...window, size: { width: newWidth, height: newHeight } }
          : window
      ));
    };

    const handleMouseUp = () => {
      resizeRef.current.isResizing = false;
      resizeRef.current.windowId = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleBar}>
        <h1>Captain's Log</h1>
        <div className={styles.controls}>
          <button 
            className={styles.newButton}
            onClick={() => createNewWindow('text')}
          >
            New Log Entry
          </button>
          <button 
            className={styles.newButton}
            onClick={() => createNewWindow('drawing')}
          >
            New Sketch
          </button>
        </div>
      </div>

      <div className={styles.desktop}>
        {windows.map(window => (
          <div
            key={window.id}
            ref={el => {
              windowRefs.current[window.id] = el;
            }}
            className={`${styles.window} ${window.isMinimized ? styles.minimized : ''} ${
              window.isMaximized ? styles.maximized : ''
            } ${activeWindowId === window.id ? styles.active : ''}`}
            style={{
              transform: `translate(${window.position.x}px, ${window.position.y}px)`,
              width: window.isMaximized ? '100%' : window.size.width,
              height: window.isMaximized ? '100%' : window.size.height,
              zIndex: window.zIndex,
              cursor: resizeRef.current.windowId === window.id ? 'se-resize' : 'default'
            }}
            onClick={() => handleWindowClick(window.id)}
          >
            <div 
              className={styles.windowTitleBar}
              onMouseDown={(e) => startDragging(e, window.id)}
            >
              <div className={styles.windowTitle}>{window.title}</div>
              <div className={styles.windowControls}>
                <button
                  className={styles.windowControl}
                  onClick={() => toggleMinimize(window.id)}
                >
                  _
                </button>
                <button
                  className={styles.windowControl}
                  onClick={() => toggleMaximize(window.id)}
                >
                  □
                </button>
                <button
                  className={`${styles.windowControl} ${styles.closeButton}`}
                  onClick={() => closeWindow(window.id)}
                >
                  ×
                </button>
              </div>
            </div>
            <div className={styles.windowContent}>
              {window.type === 'text' ? (
                <textarea
                  value={window.content}
                  onChange={(e) => {
                    setWindows(prev => prev.map(w =>
                      w.id === window.id ? { ...w, content: e.target.value } : w
                    ));
                  }}
                  placeholder="Captain's Log, Stardate [Enter Date]..."
                  className={styles.textArea}
                />
              ) : (
                <DrawingCanvas
                  width={window.isMaximized ? (window.innerWidth || window.size.width - 40) : window.size.width - 40}
                  height={window.isMaximized ? (window.innerHeight || window.size.height - 80) : window.size.height - 80}
                />
              )}
            </div>
            {!window.isMaximized && (
              <div
                className={styles.resizeHandle}
                onMouseDown={(e) => startResizing(e, window.id)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 