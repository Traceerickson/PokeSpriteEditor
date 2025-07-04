import { useState } from 'react';

export interface SpriteTemplate {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  type: 'overworld' | 'battle' | 'custom';
}

interface Props {
  templates: SpriteTemplate[];
  onCreate: (template: SpriteTemplate, name: string) => void;
}

export default function ProjectModal({ templates, onCreate }: Props) {
  const [selected, setSelected] = useState(templates[0]);
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-11/12 max-w-3xl space-y-4">
        <h2 className="text-xl font-bold text-center">Create New Project</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className={`border rounded p-3 text-left hover:border-blue-400 ${selected.id === t.id ? 'border-blue-500' : 'border-gray-600'}`}
            >
              <div className="font-semibold">{t.name}</div>
              <div className="text-xs text-gray-300">{t.description}</div>
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="pname">Project Name</label>
          <input id="pname" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => onCreate(selected, name)} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">Create</button>
        </div>
      </div>
    </div>
  );
}
