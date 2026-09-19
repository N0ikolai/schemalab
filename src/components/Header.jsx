import { useContext } from 'react';
import { CircuitContext } from '../context/CircuitContext.jsx';

export function Header({ onShowToast }) {
  const { setCircuit, setSelectedComponentId, setSelectedWireId } = useContext(CircuitContext);

  const handleClear = () => {
    if (window.confirm('Ви впевнені, що хочете повністю очистити поле?')) {
      setCircuit({ components: [], wires: [] });
      setSelectedComponentId(null);
      setSelectedWireId(null);
      onShowToast('Поле очищено', 'success');
    }
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-10">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-sky-500 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
          ⚡
        </div>
        <h1 className="text-lg font-bold text-slate-100 tracking-wide">СхемаЛаб</h1>
      </div>
      <div className="flex items-center space-x-3">
        <button 
          onClick={handleClear}
          className="px-4 py-1.5 text-xs font-medium text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 rounded border border-rose-400/20 transition-colors"
        >
          Очистити поле
        </button>
      </div>
    </header>
  );
}