
interface Props {
  tool: string;
  setTool: (t: string) => void;
  undo: () => void;
  info: string;
}

export default function TopBar({ tool, setTool, undo, info }: Props) {
  const btn = (id: string, label: string) => (
    <button
      onClick={() => setTool(id)}
      className={`${tool === id ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-gray-600 px-2 py-1 rounded`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
      {btn('pencil', 'Pencil')}
      {btn('eraser', 'Eraser')}
      {btn('dropper', 'Eyedropper')}
      <button onClick={undo} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded">Undo</button>
      <div className="ml-auto text-sm text-gray-300">{info}</div>
    </div>
  );
}
