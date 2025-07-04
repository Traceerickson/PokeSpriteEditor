
interface Props {
  color: string;
  setColor: (c: string) => void;
  exportSheet: () => void;
}

export default function LeftSidebar({ color, setColor, exportSheet }: Props) {
  return (
    <div className="space-y-4 p-2 w-40">
      <div>
        <label className="block text-sm mb-1">Current Color</label>
        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full" />
      </div>
      <div className="pt-4 border-t border-gray-700">
        <button onClick={exportSheet} className="w-full bg-green-600 hover:bg-green-700 text-white py-1 rounded shadow">
          Export Sprite Sheet
        </button>
        <p className="text-xs text-center text-gray-300 mt-1">PNG format, transparent background</p>
      </div>
    </div>
  );
}
