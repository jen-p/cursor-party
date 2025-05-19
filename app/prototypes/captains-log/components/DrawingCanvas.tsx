import { useEffect, useRef, useState } from 'react';
import styles from '../styles.module.css';

interface DrawingCanvasProps {
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

const LCARS_COLORS = [
  '#FF9C00', // Orange
  '#FFFF33', // Yellow
  '#CC99CC', // Lavender
  '#FF0000', // Red
  '#FF6666', // Salmon
  '#CC6666', // Dusty Rose
  '#99CCFF', // Light Blue
  '#209CE9', // LCARS Blue
  '#3366CC', // Deep Blue
  '#FFFFFF', // White
  '#99CC99', // Mint
  '#CC99FF', // Light Purple
];

const BRUSH_SIZES = [1, 2, 4, 8, 16];

export default function DrawingCanvas({ width, height }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#209CE9');
  const [brushSize, setBrushSize] = useState(2);
  const lastPoint = useRef<Point | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set initial canvas style
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;

    // Set canvas background
    ctx.fillStyle = 'rgba(6, 20, 37, 0.4)';
    ctx.fillRect(0, 0, width, height);
  }, [width, height, currentColor, brushSize]);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    lastPoint.current = getCanvasPoint(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const currentPoint = getCanvasPoint(e);

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    lastPoint.current = currentPoint;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = 'rgba(6, 20, 37, 0.4)';
    ctx.fillRect(0, 0, width, height);
  };

  return (
    <div className={styles.drawingContainer}>
      <div className={styles.toolBar}>
        <div className={styles.colorPalette}>
          {LCARS_COLORS.map((color) => (
            <button
              key={color}
              className={`${styles.colorOption} ${color === currentColor ? styles.colorOptionActive : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setCurrentColor(color)}
              aria-label={`Select ${color} color`}
            />
          ))}
        </div>
        <div className={styles.brushSizes}>
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              className={`${styles.brushSizeOption} ${size === brushSize ? styles.brushSizeActive : ''}`}
              onClick={() => setBrushSize(size)}
              aria-label={`Brush size ${size}`}
            >
              <div 
                className={styles.brushSizePreview} 
                style={{ width: size * 2, height: size * 2 }}
              />
            </button>
          ))}
        </div>
        <button
          onClick={clearCanvas}
          className={styles.clearButton}
          aria-label="Clear canvas"
        >
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={styles.canvas}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />
    </div>
  );
} 