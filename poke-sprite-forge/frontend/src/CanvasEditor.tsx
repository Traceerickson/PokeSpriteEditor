import { useCallback, useEffect, useRef, useState } from 'react';

export default function CanvasEditor() {
  const gridSize = 32;
  const cellSize = 16;
  const canvasSize = gridSize * cellSize;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    for (let x = 0; x <= canvasSize; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize);
      ctx.stroke();
    }
    for (let y = 0; y <= canvasSize; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize, y);
      ctx.stroke();
    }
  }, [canvasSize, cellSize]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const buffer = bufferRef.current;
    if (!canvas || !buffer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.drawImage(buffer, 0, 0);
    drawGrid(ctx);
  }, [canvasSize, drawGrid]);

  // initialise canvases
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const buffer = document.createElement('canvas');
    buffer.width = canvasSize;
    buffer.height = canvasSize;
    bufferRef.current = buffer;

    redraw();
  }, [canvasSize, redraw]);


  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let x = Math.floor((e.clientX - rect.left) / cellSize) * cellSize;
    let y = Math.floor((e.clientY - rect.top) / cellSize) * cellSize;
    x = Math.max(0, Math.min(x, canvasSize - cellSize));
    y = Math.max(0, Math.min(y, canvasSize - cellSize));
    return { x, y };
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const buffer = bufferRef.current;
    if (!buffer) return;
    const ctx = buffer.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    const erase = isErasing || e.button === 2;
    if (erase) {
      ctx.clearRect(x, y, cellSize, cellSize);
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(x, y, cellSize, cellSize);
    }
    redraw();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      draw(e);
    }
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const buffer = bufferRef.current;
    if (!buffer) return;
    const ctx = buffer.getContext('2d');
    ctx?.clearRect(0, 0, canvasSize, canvasSize);
    redraw();
    setDownloadUrl(null);
  };

  const uploadSprite = async () => {
    const buffer = bufferRef.current;
    if (!buffer) return;
    const dataUrl = buffer.toDataURL('image/png');

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    });

    if (res.ok) {
      const body = (await res.json()) as { url: string };
      setDownloadUrl(body.url);
    }
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        className="border"
        style={{ touchAction: 'none', imageRendering: 'pixelated' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className="space-x-2">
        <button onClick={() => setIsErasing((v) => !v)}>
          {isErasing ? 'Erase Mode' : 'Draw Mode'}
        </button>
        <button onClick={clearCanvas}>Clear Canvas</button>
        <button onClick={uploadSprite}>Upload Sprite</button>
      </div>
      {downloadUrl && (
        <div>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
          >
            Download Sprite
          </a>
        </div>
      )}
    </div>
  );
}
