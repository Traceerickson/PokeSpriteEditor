
interface Props {
  active: string;
  setActive: (s: string) => void;
}

const tiles = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'front-shiny', label: 'Front Shiny' },
  { id: 'back-shiny', label: 'Back Shiny' },
];

export default function RightSidebar({ active, setActive }: Props) {
  return (
    <div className="space-y-2 p-2 w-44 bg-gray-800/60 rounded shadow-inner overflow-y-auto">
      <div className="font-semibold">Battle Sprites</div>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`${active === t.id ? 'ring-2 ring-blue-500 bg-gray-700' : 'bg-gray-700'} hover:bg-gray-600 p-2 rounded text-xs transition`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
