
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
    <div className="space-y-2 p-2 w-40">
      <div className="font-semibold">Battle Sprites</div>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`${active === t.id ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-gray-600 p-2 rounded text-xs`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
