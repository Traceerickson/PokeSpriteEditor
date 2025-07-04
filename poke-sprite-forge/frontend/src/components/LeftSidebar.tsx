
import { useRef } from 'react';

interface Props {
  color: string;
  setColor: (c: string) => void;
  exportSheet: () => void;
  importSprite: (file: File) => void;
}

export default function LeftSidebar({ color, setColor, exportSheet, importSprite }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleImport = () => fileRef.current?.click();
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) importSprite(f);
    e.target.value = '';
  };
  return (
    <div className="space-y-4 p-2 w-44 bg-gray-800/60 rounded shadow-inner overflow-y-auto">
      <div>
        <label className="block text-sm mb-1">Current Color</label>
        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full" />
      </div>
      <div className="pt-4 border-t border-gray-700 space-y-2">
        <button onClick={exportSheet} className="w-full bg-green-600 hover:bg-green-700 text-white py-1 rounded shadow transition">
          Export Sprite Sheet
        </button>
        <button onClick={handleImport} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 rounded shadow transition">
          Import Sprite
        </button>
        <input ref={fileRef} type="file" accept="image/png" className="hidden" onChange={onFile} />
        <p className="text-xs text-center text-gray-300">PNG format</p>
      </div>
    </div>
  );
}
