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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(2);
  const canvasWidth = template.width * scale;
  const canvasHeight = template.height * scale;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const computeScale = useCallback(() => {
    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
    const desired = containerWidth * 0.65; // aim to fill ~65% of space
    const newScale = Math.max(1, Math.floor(desired / template.width));
    setScale(newScale);
  }, [template]);

  useEffect(() => {
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, [computeScale]);

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

  // initialise canvases whenever the template or scale changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    if (
      !bufferRef.current ||
      bufferRef.current.width !== template.width ||
      bufferRef.current.height !== template.height
    ) {
      const buffer = document.createElement('canvas');
      buffer.width = template.width;
      buffer.height = template.height;
      bufferRef.current = buffer;
    }

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

  const importSprite = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const buffer = document.createElement('canvas');
      buffer.width = img.width;
      buffer.height = img.height;
      const ctx = buffer.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0);
      bufferRef.current = buffer;
      setTemplate({
        id: 'imported',
        name: 'Imported Sprite',
        width: img.width,
        height: img.height,
      });
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center space-y-4 p-4">
      <div className="flex items-center space-x-2">
        <label htmlFor="template" className="font-medium">Template:</label>
        <select
          id="template"
          value={template.id}
          onChange={(e) =>
            setTemplate(
              TEMPLATES.find((t) => t.id === e.target.value) || TEMPLATES[0]
            )
          }
          className="bg-gray-800 border border-gray-600 text-white px-2 py-1 rounded"
        >
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="border border-gray-700 shadow-lg p-2 bg-black">
        <canvas
          ref={canvasRef}
          className="block"
          width={canvasWidth}
          height={canvasHeight}
          style={{ touchAction: 'none', imageRendering: 'pixelated' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
      <div className="text-sm text-center text-gray-300">
        {template.name} — {template.width}x{template.height}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          onClick={() => setIsErasing((v) => !v)}
        >
          {isErasing ? 'Erase Mode' : 'Draw Mode'}
        </button>
        <button
          className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded"
          onClick={clearCanvas}
        >
          Clear Canvas
        </button>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          onClick={uploadSprite}
        >
          Upload Sprite
        </button>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          onClick={importSprite}
        >
          Import Sprite
        </button>
      </div>
      <input
        type="file"
        accept="image/png"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      {downloadUrl && (
        <div>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="underline text-blue-500"
          >
            Download Sprite
          </a>
        </div>
      )}
    </div>
  );
}
