import { useContext } from 'react';
import { CircuitContext } from '../context/CircuitContext.jsx';
import { PRESETS } from '../constants/presets.js';

export function Header({ onShowHelp, onShowToast }) {
  const { tool, setTool, setCircuit, simulationActive, setSimulationActive, circuit } = useContext(CircuitContext);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(circuit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'schemalab-circuit.json'; a.click();
    URL.revokeObjectURL(url);
    onShowToast('Схему експортовано', 'success');
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-100 text-base">СхемаЛаб</span>
          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
            DC Симулятор
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
        <button onClick={() => setTool('select')} className={`px-3 py-1.5 rounded text-xs font-medium ${tool === 'select' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}>Вибір</button>
        <button onClick={() => setTool('wire')} className={`px-3 py-1.5 rounded text-xs font-medium ${tool === 'wire' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}>Провід</button>
        <button onClick={() => setTool('delete')} className={`px-3 py-1.5 rounded text-xs font-medium ${tool === 'delete' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}>Видалити</button>
      </div>

      <div className="flex items-center space-x-2">
        <select
          onChange={(e) => {
            const ex = PRESETS.find(p => p.id === e.target.value);
            if (ex) {
              setCircuit(JSON.parse(JSON.stringify(ex.circuit)));
              onShowToast(`Завантажено: ${ex.nameUk}`, 'success');
            }
            e.target.value = '';
          }}
          defaultValue=""
          className="bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 px-2.5 py-1.5 cursor-pointer"
        >
          <option value="" disabled>Оберіть приклад...</option>
          {PRESETS.map(p => <option key={p.id} value={p.id}>{p.nameUk}</option>)}
        </select>

        <button onClick={() => setSimulationActive(!simulationActive)} className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 ${simulationActive ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
          <span className={`w-2 h-2 rounded-full ${simulationActive ? 'bg-emerald-300 animate-pulse' : 'bg-amber-200'}`} />
          <span>{simulationActive ? 'Розрахунок' : 'Пауза'}</span>
        </button>

        <button onClick={handleExport} className="px-2.5 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700">
          Експорт
        </button>

        <button onClick={onShowHelp} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
          ?
        </button>
      </div>
    </header>
  );
}