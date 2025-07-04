
interface Props {
  active: number;
  setActive: (n: number) => void;
  playing: boolean;
  togglePlay: () => void;
}

export default function FramePanel({ active, setActive, playing, togglePlay }: Props) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-800 border-t border-gray-700">
      {[0,1,2,3].map(i => (
        <button
          key={i}
          onClick={() => setActive(i)}
          className={`${active === i ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-gray-600 px-2 py-1 rounded`}
        >
          Frame {i + 1}
        </button>
      ))}
      <button onClick={togglePlay} className="ml-auto bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded">
        {playing ? 'Stop' : 'Play'}
      </button>
    </div>
  );
}
