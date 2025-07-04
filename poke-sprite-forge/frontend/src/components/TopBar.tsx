
interface Props {
  tool: string;
  setTool: (t: string) => void;
  undo: () => void;
  info: string;
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
}

export default function TopBar({ tool, setTool, undo, info, zoom, zoomIn, zoomOut }: Props) {
  const btn = (id: string, label: string) => (
    <button
      onClick={() => setTool(id)}
      className={`${tool === id ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-gray-600 px-2 py-1 rounded`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700 shadow">
      {btn('pencil', 'Pencil')}
      {btn('eraser', 'Eraser')}
      {btn('dropper', 'Eyedropper')}
      <button onClick={undo} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition">Undo</button>
      <div className="flex items-center gap-1 ml-auto">
        <button onClick={zoomOut} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition">-</button>
        <span className="px-1 text-sm">{zoom}x</span>
        <button onClick={zoomIn} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition">+</button>
      </div>
      <div className="ml-4 text-sm text-gray-300 whitespace-nowrap">{info}</div>
    </div>
  );
}
