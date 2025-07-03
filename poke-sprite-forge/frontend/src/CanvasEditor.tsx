import { useEffect, useRef, useState } from 'react';

export default function CanvasEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [color, setColor] = useState<string>('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const bufferRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    bufferRef.current = off;
  }, []);

  const drawGrid = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    for (let i = 0; i <= canvas.width; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j <= canvas.height; j += 16) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const buffer = bufferRef.current;
    if (!canvas || !ctx || !buffer) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(buffer, 0, 0);
    drawGrid();
  };

  const drawPixel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const buffer = bufferRef.current;
    if (!canvas || !buffer) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 16) * 16;
    const y = Math.floor((e.clientY - rect.top) / 16) * 16;
    const ctx = buffer.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 16, 16);
    redraw();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    drawPixel(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      drawPixel(e);
    }
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleExport = async () => {
    const buffer = bufferRef.current;
    if (!buffer) return;
    const dataUrl = buffer.toDataURL('image/png');
    const res = await fetch('/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl })
    });
    if (res.ok) {
      const result = await res.json();
      alert(`Uploaded! URL: ${result.url}`);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".png,.nclr,image/png"
        onChange={handleFileChange}
      />
      <input type="color" value={color} onChange={e => setColor(e.target.value)} />
      <canvas
        ref={canvasRef}
        width={256}
        height={256}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ border: '1px solid #ccc', touchAction: 'none' }}
      />
      {imageSrc && (
        <img
          src={imageSrc}
          alt="preview"
          onLoad={e => {
            const canvas = canvasRef.current;
            const buffer = bufferRef.current;
            const ctx = buffer?.getContext('2d');
            if (canvas && buffer && ctx) {
              const img = e.currentTarget;
              canvas.width = img.width;
              canvas.height = img.height;
              buffer.width = img.width;
              buffer.height = img.height;
              ctx.clearRect(0, 0, buffer.width, buffer.height);
              ctx.drawImage(img, 0, 0);
              redraw();
            }
          }}
          style={{ display: 'none' }}
        />
      )}
      <button onClick={handleExport}>Export</button>
    </div>
  );
}
