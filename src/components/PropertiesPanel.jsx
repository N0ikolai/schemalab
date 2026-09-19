import { useContext } from 'react';
import { CircuitContext } from '../context/CircuitContext.jsx';
import { COMPONENT_CATALOG } from '../constants/componentCatalog.js';

export function PropertiesPanel({ onShowToast }) {
  const { circuit, setCircuit, selectedComponentId, selectedWireId, setSelectedComponentId, setSelectedWireId } = useContext(CircuitContext);

  const selectedComponent = circuit.components.find(c => c.id === selectedComponentId);
  const selectedWire = circuit.wires.find(w => w.id === selectedWireId);

  if (!selectedComponent && !selectedWire) {
    return (
      <aside className="w-80 bg-slate-900 border-l border-slate-800 p-4 text-slate-400 text-xs shrink-0 select-none">
        <h2 className="font-bold text-slate-300 uppercase tracking-wider mb-2">Властивості</h2>
        <p className="text-slate-500 italic">Оберіть елемент або провід на схемі</p>
      </aside>
    );
  }

  const meta = selectedComponent ? COMPONENT_CATALOG[selectedComponent.kind] : null;

  const handleValueChange = (e) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    setCircuit(prev => ({
      ...prev,
      components: prev.components.map(c => c.id === selectedComponent.id ? { ...c, value: val } : c)
    }));
  };

  const handleLabelChange = (e) => {
    const newLabel = e.target.value;
    setCircuit(prev => ({
      ...prev,
      components: prev.components.map(c => c.id === selectedComponent.id ? { ...c, label: newLabel } : c)
    }));
  };

  const handleHotkeyChange = (e) => {
    const key = e.target.value.toUpperCase().slice(0, 1);
    setCircuit(prev => ({
      ...prev,
      components: prev.components.map(c => c.id === selectedComponent.id ? { ...c, hotkey: key } : c)
    }));
  };

  const handleDelete = () => {
    if (selectedComponentId) {
      setCircuit(prev => ({
        components: prev.components.filter(c => c.id !== selectedComponentId),
        wires: prev.wires.filter(w => w.from.componentId !== selectedComponentId && w.to.componentId !== selectedComponentId)
      }));
      setSelectedComponentId(null);
      onShowToast('Елемент видалено');
    } else if (selectedWireId) {
      setCircuit(prev => ({
        ...prev,
        wires: prev.wires.filter(w => w.id !== selectedWireId)
      }));
      setSelectedWireId(null);
      onShowToast('Провід видалено');
    }
  };

  const handleToggleSwitch = () => {
    setCircuit(prev => ({
      ...prev,
      components: prev.components.map(c => c.id === selectedComponent.id ? { ...c, value: c.value === 1 ? 0 : 1 } : c)
    }));
  };

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 p-4 flex flex-col h-full shrink-0 select-none">
      <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Властивості</h2>

      {selectedComponent && meta && (
        <div className="space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Тип елемента</label>
            <div className="text-sm font-bold text-sky-400">{meta.nameUk}</div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Назва (Маркування)</label>
            <input 
              type="text" 
              value={selectedComponent.label} 
              onChange={handleLabelChange}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500" 
            />
          </div>

          {meta.defaultValue !== undefined && selectedComponent.kind !== 'switch' && (
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                Номінал ({meta.unit})
              </label>
              <input 
                type="number" 
                step="any" 
                value={selectedComponent.value} 
                onChange={handleValueChange}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500" 
              />
            </div>
          )}

          {selectedComponent.kind === 'switch' && (
            <>
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Стан вимикача</label>
                <button 
                  onClick={handleToggleSwitch}
                  className={`w-full py-2 px-3 rounded text-xs font-bold border transition-colors ${
                    selectedComponent.value === 1 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30' 
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {selectedComponent.value === 1 ? '🟢 ЗАМКНЕНО (ON)' : '🔴 РОЗІМКНЕНО (OFF)'}
                </button>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Клавіша керування на клавіатурі</label>
                <input 
                  type="text" 
                  maxLength={1}
                  value={selectedComponent.hotkey || ''} 
                  onChange={handleHotkeyChange}
                  placeholder="Наприклад: S"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-amber-400 font-bold uppercase text-center focus:outline-none focus:border-sky-500" 
                />
              </div>
            </>
          )}

          <div className="pt-2 text-[11px] text-slate-400 bg-slate-800/40 p-2.5 rounded border border-slate-800">
            {meta.descriptionUk}
          </div>
        </div>
      )}

      {selectedWire && (
        <div className="space-y-4 flex-1">
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Об'єкт</label>
            <div className="text-sm font-bold text-amber-400">З'єднувальний провід</div>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-800 mt-auto">
        <button 
          onClick={handleDelete}
          className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs font-bold transition-colors"
        >
          Видалити об'єкт
        </button>
      </div>
    </aside>
  );
}