import { useCallback, useEffect, useRef, useState } from 'react';
import ProjectModal, { type SpriteTemplate } from './components/ProjectModal';
import TopBar from './components/TopBar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import FramePanel from './components/FramePanel';

const TEMPLATES: SpriteTemplate[] = [
  {
    id: 'ow-ds',
    name: 'Overworld Sprite (DS Style)',
    description: '4-directional, 16 frames, 32×32 per frame',
    width: 128,
    height: 128,
    type: 'overworld',
  },
  {
    id: 'ow-gba',
    name: 'Overworld Sprite (GBA Style)',
    description: '4-directional, 16 frames, 32×16 per frame',
    width: 128,
    height: 64,
    type: 'overworld',
  },
  {
    id: 'battle-g5',
    name: 'Battle Sprite (Gen 5 Style)',
    description: '96×96 front/back',
    width: 96,
    height: 96,
    type: 'battle',
  },
  {
    id: 'battle-g34',
    name: 'Battle Sprite (Gen 3/4 Style)',
    description: '80×80 front/back',
    width: 80,
    height: 80,
    type: 'battle',
  },
  {
    id: 'custom',
    name: 'Custom Project',
    description: '128×128 canvas by default',
    width: 128,
    height: 128,
    type: 'custom',
  },
];

interface Props {
  project?: { template: SpriteTemplate; name: string };
}

export default function CanvasEditor({ project }: Props) {
  const [showModal, setShowModal] = useState(!project);
  const [template, setTemplate] = useState<SpriteTemplate>(project?.template || TEMPLATES[0]);
  const [projectName, setProjectName] = useState(project?.name || '');

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<HTMLCanvasElement | null>(null);
  const [scale, setScale] = useState(4);
  const [tool, setTool] = useState('pencil');
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [activeFrame, setActiveFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [activeTile, setActiveTile] = useState('front');
  const frameMapRef = useRef<Record<string, Record<number, ImageData | null>>>({});
  const historyRef = useRef<ImageData[]>([]);
  const [, setFrameVersion] = useState(0);

  const canvasWidth = template.width;
  const canvasHeight = template.height;
  const displayWidth = canvasWidth * scale;
  const displayHeight = canvasHeight * scale;

  const startProject = (t: SpriteTemplate, name: string) => {
    setTemplate(t);
    setProjectName(name || 'Untitled');
    setShowModal(false);
  };

  const zoomIn = () => setScale(s => Math.min(8, s + 1));
  const zoomOut = () => setScale(s => Math.max(1, s - 1));

  const computeScale = useCallback(() => {
    const w = containerRef.current?.offsetWidth || window.innerWidth;
    const max = Math.floor((w * 0.6) / template.width);
    setScale(s => Math.min(Math.max(1, s), Math.min(8, Math.max(1, max))));
  }, [template]);

  useEffect(() => {
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, [computeScale]);


  const drawGrid = () => {
    const gridCanvas = gridRef.current;
    if (!gridCanvas) return;
    const g = gridCanvas.getContext('2d');
    if (!g) return;
    g.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    g.strokeStyle = 'rgba(0,0,0,0.4)';
    g.lineWidth = 1;
    for (let x = 0; x <= canvasWidth; x++) {
      g.beginPath();
      g.moveTo(x * scale + 0.5, 0);
      g.lineTo(x * scale + 0.5, gridCanvas.height);
      g.stroke();
    }
    for (let y = 0; y <= canvasHeight; y++) {
      g.beginPath();
      g.moveTo(0, y * scale + 0.5);
      g.lineTo(gridCanvas.width, y * scale + 0.5);
      g.stroke();
    }
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const buffer = bufferRef.current;
    if (!canvas || !buffer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buffer, 0, 0);
    drawGrid();
  }, [canvasWidth, canvasHeight, template, scale, drawGrid]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas || !grid) return;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    grid.width = displayWidth;
    grid.height = displayHeight;
    grid.style.width = `${displayWidth}px`;
    grid.style.height = `${displayHeight}px`;
    if (!bufferRef.current || bufferRef.current.width !== template.width || bufferRef.current.height !== template.height) {
      const b = document.createElement('canvas');
      b.width = template.width;
      b.height = template.height;
      bufferRef.current = b;
    }
    frameMapRef.current = {};
    ['front','back','front-shiny','back-shiny'].forEach(k => { frameMapRef.current[k] = {}; });
    redraw();
  }, [canvasWidth, canvasHeight, displayWidth, displayHeight, template, redraw]);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);
    return { x: Math.max(0, Math.min(x, template.width - 1)), y: Math.max(0, Math.min(y, template.height - 1)) };
  };

  const applyTool = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const buffer = bufferRef.current;
    if (!buffer) return;
    const ctx = buffer.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    if (tool === 'eraser') {
      ctx.clearRect(x, y, 1, 1);
    } else if (tool === 'dropper') {
      const data = ctx.getImageData(x, y, 1, 1).data;
      const c = `#${Array.from(data).slice(0,3).map(v => v.toString(16).padStart(2,'0')).join('')}`;
      setColor(c);
      setTool('pencil');
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
    redraw();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    applyTool(e);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing && tool !== 'dropper') applyTool(e);
  };
  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const buffer = bufferRef.current;
    if (!buffer) return;
    const ctx = buffer.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, template.width, template.height);
    historyRef.current.push(data);
    frameMapRef.current[activeTile][activeFrame] = data;
    setFrameVersion(v => v + 1);
  };

  const loadFrame = (tile: string, fr: number) => {
    const buffer = bufferRef.current;
    if (!buffer) return;
    const ctx = buffer.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, template.width, template.height);
    const data = frameMapRef.current[tile]?.[fr];
    if (data) ctx.putImageData(data, 0, 0);
    redraw();
  };

  const undo = () => {
    const buffer = bufferRef.current;
    if (!buffer || historyRef.current.length === 0) return;
    const ctx = buffer.getContext('2d');
    if (!ctx) return;
    historyRef.current.pop();
    const last = historyRef.current[historyRef.current.length - 1];
    ctx.clearRect(0, 0, template.width, template.height);
    if (last) ctx.putImageData(last, 0, 0);
    frameMapRef.current[activeTile][activeFrame] = last || null;
    redraw();
    setFrameVersion(v => v + 1);
  };

  const exportSheet = () => {
    const canvas = bufferRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${projectName || 'sprite'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const importSprite = (file: File) => {
    const img = new Image();
    img.onload = () => {
      const buffer = bufferRef.current;
      if (!buffer) return;
      const ctx = buffer.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, template.width, template.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, template.width, template.height);
      redraw();
      saveCurrentFrame();
    };
    img.src = URL.createObjectURL(file);
  };

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setActiveFrame(f => {
        const next = (f + 1) % 4;
        loadFrame(activeTile, next);
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [playing, activeTile, loadFrame]);

  const info = `${template.width}×${template.height} • ${scale}x zoom`;

  if (showModal) return <ProjectModal templates={TEMPLATES} onCreate={startProject} />;

  return (
    <div className="flex flex-col h-full overflow-hidden" ref={containerRef}>
      <TopBar tool={tool} setTool={setTool} undo={undo} info={info} zoom={scale} zoomIn={zoomIn} zoomOut={zoomOut} />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar color={color} setColor={setColor} exportSheet={exportSheet} importSprite={importSprite} />
        <div className="flex-1 flex items-center justify-center bg-gray-900 overflow-auto">
          <div className="relative bg-[repeating-conic-gradient(#4b5563_0%_25%,#374151_0%_50%)] bg-[length:16px_16px]" style={{ width: displayWidth, height: displayHeight }}>
            <canvas
              ref={canvasRef}
              className="border border-gray-700 absolute inset-0"
              style={{ imageRendering: 'pixelated', touchAction: 'none', width: displayWidth, height: displayHeight }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
              width={canvasWidth}
              height={canvasHeight}
            />
            <canvas
              ref={gridRef}
              className="absolute inset-0 pointer-events-none"
              style={{ imageRendering: 'pixelated', width: displayWidth, height: displayHeight }}
              width={displayWidth}
              height={displayHeight}
            />
          </div>
        </div>
        <RightSidebar
          active={activeTile}
          setActive={(tile) => {
            saveCurrentFrame();
            setActiveTile(tile);
            loadFrame(tile, activeFrame);
          }}
        />
      </div>
      <FramePanel
        active={activeFrame}
        setActive={(fr) => {
          saveCurrentFrame();
          setActiveFrame(fr);
          loadFrame(activeTile, fr);
        }}
        playing={playing}
        togglePlay={() => setPlaying((p) => !p)}
        frames={[0,1,2,3].map(i => frameMapRef.current[activeTile]?.[i] || null)}
        width={template.width}
        height={template.height}
      />
    </div>
  );

  function saveCurrentFrame() {
    const buffer = bufferRef.current;
    if (!buffer) return;
    const ctx = buffer.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, template.width, template.height);
    frameMapRef.current[activeTile][activeFrame] = data;
    setFrameVersion(v => v + 1);
  }
}
