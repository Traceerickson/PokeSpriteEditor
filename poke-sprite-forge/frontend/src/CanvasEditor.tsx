import { useCallback, useEffect, useRef, useState } from 'react';

interface SpriteTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  frameWidth?: number;
  frameHeight?: number;
  framesAcross?: number;
  framesDown?: number;
}

const TEMPLATES: SpriteTemplate[] = [
  {
    id: 'ow-gba',
    name: 'Overworld (GBA)',
    width: 128,
    height: 64,
    frameWidth: 32,
    frameHeight: 16,
    framesAcross: 4,
    framesDown: 4,
  },
  {
    id: 'ow-ds',
    name: 'Overworld (DS)',
    width: 128,
    height: 128,
    frameWidth: 32,
    frameHeight: 32,
    framesAcross: 4,
    framesDown: 4,
  },
  {
    id: 'battle-front-g34',
    name: 'Battle Sprite (Gen 3–4 Front)',
    width: 80,
    height: 80,
  },
  {
    id: 'battle-back-g34',
    name: 'Battle Sprite (Gen 3–4 Back)',
    width: 80,
    height: 80,
  },
  {
    id: 'battle-g5',
    name: 'Battle Sprite (Gen 5 Front/Back)',
    width: 96,
    height: 96,
  },
];

export default function CanvasEditor() {
  const [template, setTemplate] = useState<SpriteTemplate>(TEMPLATES[0]);
  const scale = 2;
  const canvasWidth = template.width * scale;
  const canvasHeight = template.height * scale;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      for (let x = 0; x <= template.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * scale, 0);
        ctx.lineTo(x * scale, canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= template.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * scale);
        ctx.lineTo(canvasWidth, y * scale);
        ctx.stroke();
      }

      if (
        template.frameWidth &&
        template.frameHeight &&
        template.framesAcross &&
        template.framesDown
      ) {
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        for (let i = 1; i < template.framesAcross; i++) {
          const x = i * template.frameWidth;
          ctx.beginPath();
          ctx.moveTo(x * scale, 0);
          ctx.lineTo(x * scale, canvasHeight);
          ctx.stroke();
        }
        for (let i = 1; i < template.framesDown; i++) {
          const y = i * template.frameHeight;
          ctx.beginPath();
          ctx.moveTo(0, y * scale);
          ctx.lineTo(canvasWidth, y * scale);
          ctx.stroke();
        }
      }

      if (template.id === 'battle-back-g34') {
        const cropY = (template.height - 16) * scale;
        ctx.strokeStyle = 'rgba(255,0,0,0.5)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, cropY);
        ctx.lineTo(canvasWidth, cropY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    },
    [template, scale, canvasWidth, canvasHeight]
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const buffer = bufferRef.current;
    if (!canvas || !buffer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      buffer,
      0,
      0,
      template.width,
      template.height,
      0,
      0,
      canvasWidth,
      canvasHeight
    );
    drawGrid(ctx);
  }, [canvasWidth, canvasHeight, drawGrid, template]);

  // initialise canvases whenever the template changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const buffer = document.createElement('canvas');
    buffer.width = template.width;
    buffer.height = template.height;
    bufferRef.current = buffer;

    redraw();
  }, [canvasWidth, canvasHeight, template, redraw]);


  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);
    const clampedX = Math.max(0, Math.min(x, template.width - 1));
    const clampedY = Math.max(0, Math.min(y, template.height - 1));
    return { x: clampedX, y: clampedY };
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const buffer = bufferRef.current;
    if (!buffer) return;
    const ctx = buffer.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    const erase = isErasing || e.button === 2;
    if (erase) {
      ctx.clearRect(x, y, 1, 1);
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(x, y, 1, 1);
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
    ctx?.clearRect(0, 0, template.width, template.height);
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
      body: JSON.stringify({ image: dataUrl, template: template.id }),
    });

    if (res.ok) {
      const body = (await res.json()) as { url: string };
      setDownloadUrl(body.url);
    }
  };

  return (
    <div className="space-y-2">
      <select
        value={template.id}
        onChange={(e) =>
          setTemplate(
            TEMPLATES.find((t) => t.id === e.target.value) || TEMPLATES[0]
          )
        }
        className="border p-1"
      >
        {TEMPLATES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <canvas
        ref={canvasRef}
        className="border"
        width={canvasWidth}
        height={canvasHeight}
        style={{ touchAction: 'none', imageRendering: 'pixelated' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className="text-sm text-center">
        {template.name} — {template.width}x{template.height}
      </div>
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
