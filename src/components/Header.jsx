import { useContext, useRef } from 'react';
import { CircuitContext } from '../context/CircuitContext.jsx';
import { resetSimulation } from '../engine/solveCircuit.js';

export function Header({ onShowToast, onStartTutorial }) {
  const { circuit, setCircuit, setSelectedComponentId, setSelectedWireId } = useContext(CircuitContext);
  const fileInputRef = useRef(null);

  const handleClear = () => {
    if (window.confirm('Ви впевнені, що хочете повністю очистити поле?')) {
      setCircuit({ components: [], wires: [] });
      setSelectedComponentId(null);
      setSelectedWireId(null);
      resetSimulation();
      onShowToast('Поле очищено', 'success');
    }
  };

  const handleResetTime = () => {
    resetSimulation();
    onShowToast('Перехідні процеси скинуто', 'success');
  };

  const handleExport = () => {
    if (circuit.components.length === 0) {
      return onShowToast('Немає елементів для збереження', 'warning');
    }
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(circuit, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "schema.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    onShowToast('Схему збережено у файл', 'success');
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleImportFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedCircuit = JSON.parse(e.target.result);
        
        if (importedCircuit && Array.isArray(importedCircuit.components) && Array.isArray(importedCircuit.wires)) {
          setCircuit(importedCircuit);
          setSelectedComponentId(null);
          setSelectedWireId(null);
          resetSimulation(); 
          onShowToast('Схему успішно завантажено', 'success');
        } else {
          onShowToast('Помилка: невірний формат файлу схеми', 'error');
        }
      } catch (error) {
        onShowToast('Помилка читання файлу', 'error');
      }
      
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-10">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-sky-500 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
          ⚡
        </div>
        <h1 className="text-lg font-bold text-slate-100 tracking-wide">СхемаЛаб</h1>
      </div>
      <div className="flex items-center space-x-2">
        <button 
          onClick={handleExport}
          className="px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
        >
          💾 Зберегти
        </button>
        <button 
          onClick={handleImportClick}
          className="px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
        >
          📂 Завантажити
        </button>
        <input 
          type="file" 
          accept=".json" 
          ref={fileInputRef} 
          onChange={handleImportFile} 
          className="hidden" 
        />
        
        <div className="w-px h-6 bg-slate-700 mx-1"></div>

        <button 
          onClick={handleResetTime}
          className="px-3 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 rounded border border-emerald-400/30 transition-colors"
        >
          🔄 Час
        </button>
        <button 
          onClick={onStartTutorial}
          className="px-3 py-1.5 text-xs font-bold text-sky-400 bg-sky-400/10 hover:bg-sky-400/20 rounded border border-sky-400/30 transition-colors"
        >
          🎓 Навчання
        </button>
        <button 
          onClick={handleClear}
          className="px-3 py-1.5 text-xs font-medium text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 rounded border border-rose-400/20 transition-colors"
        >
          Очистити
        </button>
      </div>
    </header>
  );
}