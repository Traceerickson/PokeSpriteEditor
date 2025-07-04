import { useEffect, useRef } from 'react';

interface Props {
  active: number;
  setActive: (n: number) => void;
  playing: boolean;
  togglePlay: () => void;
  frames: (ImageData | null)[];
  width: number;
  height: number;
}

export default function FramePanel({ active, setActive, playing, togglePlay, frames, width, height }: Props) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    canvasRefs.current.forEach((c, idx) => {
      if (!c) return;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const data = frames[idx];
      if (data) ctx.putImageData(data, 0, 0);
    });
  }, [frames, width, height]);

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-800 border-t border-gray-700 shadow">
      {[0, 1, 2, 3].map(i => (
        <button
          key={i}
          onClick={() => setActive(i)}
          className={`rounded p-1 ${active === i ? 'ring-2 ring-blue-500' : ''}`}
        >
          <canvas
            ref={el => {
              canvasRefs.current[i] = el;
            }}
            width={width}
            height={height}
            style={{ width: 40, height: 40, imageRendering: 'pixelated' }}
          />
        </button>
      ))}
      <button onClick={togglePlay} className="ml-auto bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition">
        {playing ? 'Stop' : 'Play'}
      </button>
    </div>
  );
}
