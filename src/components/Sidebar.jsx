import { useContext } from 'react';
import { CircuitContext } from '../context/CircuitContext.jsx';
import { COMPONENT_CATALOG } from '../constants/componentCatalog.js';
import { formatVoltage, formatCurrent, formatPower } from '../utils/formatters.js';

export function Sidebar({ onShowToast }) {
  const { circuit, setCircuit, selectedComponentId, setSelectedComponentId, setSelectedWireId, solveResult } = useContext(CircuitContext);

  const handleAddComponent = (kind) => {
    const meta = COMPONENT_CATALOG[kind];
    const count = circuit.components.filter(c => c.kind === kind).length;
    const label = `${meta.defaultLabelPrefix}${count + 1}`;
    const offset = (circuit.components.length % 5) * 20;
    const newComp = {
      id: `${kind}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      kind, x: 340 + offset, y: 260 + offset,
      rotation: kind === 'battery' || kind === 'resistor' ? 90 : 0,
      value: meta.defaultValue, label,
      ledColor: kind === 'led' ? 'red' : undefined,
    };
    setCircuit(prev => ({ ...prev, components: [...prev.components, newComp] }));
    setSelectedComponentId(newComp.id);
    setSelectedWireId(null);
    onShowToast(`Додано: ${meta.nameUk} (${label})`);
  };

  const handleRotateComponent = (id) => {
    setCircuit(prev => ({
      ...prev,
      components: prev.components.map(c => c.id === id ? { ...c, rotation: (c.rotation + 90) % 360 } : c)
    }));
  };

  const handleDeleteComponent = (id) => {
    setCircuit(prev => ({
      components: prev.components.filter(c => c.id !== id),
      wires: prev.wires.filter(w => w.from.componentId !== id && w.to.componentId !== id)
    }));
    if (selectedComponentId === id) setSelectedComponentId(null);
    onShowToast('Елемент видалено');
  };

  const selectedComp = circuit.components.find(c => c.id === selectedComponentId);
  const selectedSim = selectedComp ? solveResult.components[selectedComp.id] : null;

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden select-none shrink-0">
      <div className="p-4 border-b border-slate-800 shrink-0">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Палітра компонентів</h2>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(COMPONENT_CATALOG).map(item => (
            <button key={item.kind} onClick={() => handleAddComponent(item.kind)} className="flex items-center space-x-2 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition-all">
              <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-sky-400 text-xs font-bold font-mono">
                {item.defaultLabelPrefix[0]}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-slate-200 truncate">{item.nameUk}</div>
                <div className="text-[10px] text-slate-500">{item.defaultValue > 0 || item.kind === 'switch' ? `${item.defaultValue} ${item.unit}` : ''}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-slate-800 flex-1 overflow-y-auto space-y-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Властивості елемента</h2>
        {selectedComp ? (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Тип:</span>
              <span className="font-bold text-sky-400">{COMPONENT_CATALOG[selectedComp.kind].nameUk}</span>
            </div>
            
            <div>
              <label className="block text-slate-400 mb-1">Позначення:</label>
              <input type="text" value={selectedComp.label} onChange={(e) => setCircuit(prev => ({ ...prev, components: prev.components.map(c => c.id === selectedComp.id ? { ...c, label: e.target.value } : c) }))} className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-100" />
            </div>

            {selectedComp.kind !== 'ground' && selectedComp.kind !== 'voltmeter' && selectedComp.kind !== 'ammeter' && selectedComp.kind !== 'switch' && (
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-slate-400">Номінал ({COMPONENT_CATALOG[selectedComp.kind].unit}):</label>
                  <span className="font-mono font-bold text-sky-400">{selectedComp.value}</span>
                </div>
                <input type="number" min="0.01" step={selectedComp.kind === 'led' ? '0.1' : '1'} value={selectedComp.value} onChange={(e) => setCircuit(prev => ({ ...prev, components: prev.components.map(c => c.id === selectedComp.id ? { ...c, value: parseFloat(e.target.value) || 0 } : c) }))} className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-100" />
              </div>
            )}

            {selectedComp.kind === 'switch' && (
              <div className="flex justify-between items-center mb-1 border border-slate-700 p-2 rounded bg-slate-950">
                <label className="text-slate-400">Стан:</label>
                <button 
                  onClick={() => setCircuit(prev => ({ ...prev, components: prev.components.map(c => c.id === selectedComp.id ? { ...c, value: c.value === 1 ? 0 : 1 } : c) }))}
                  className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${selectedComp.value === 1 ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                >
                  {selectedComp.value === 1 ? 'ЗАМКНЕНО' : 'РОЗІМКНЕНО'}
                </button>
              </div>
            )}

            {selectedSim && solveResult.success && (
              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-400">Показники:</div>
                <div className="flex justify-between"><span className="text-slate-400">Напруга:</span><span className="font-mono font-bold text-sky-400">{formatVoltage(selectedSim.voltage)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Струм:</span><span className="font-mono font-bold text-emerald-400">{formatCurrent(selectedSim.current)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Потужність:</span><span className="font-mono font-bold text-amber-400">{formatPower(selectedSim.power)}</span></div>
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <button onClick={() => handleRotateComponent(selectedComp.id)} className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700">Поворот (R)</button>
              <button onClick={() => handleDeleteComponent(selectedComp.id)} className="px-3 py-1.5 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs border border-rose-900/50">Видалити</button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic py-6 text-center">Оберіть елемент для редагування параметрів</div>
        )}
      </div>

      <div className="p-4 bg-slate-950/40 border-t border-slate-800 shrink-0 text-xs space-y-1.5">
        <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Статус схеми</div>
        {solveResult.success ? (
          <>
            <div className="text-emerald-400 flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /><span>Схему розв'язано успішно</span></div>
            <div className="text-[11px] text-slate-400 flex justify-between"><span>Елементів: {circuit.components.length}</span><span>Провідників: {circuit.wires.length}</span></div>
          </>
        ) : (
          <div className="text-rose-400 text-[11px]">{solveResult.errorMessageUk}</div>
        )}
      </div>
    </aside>
  );
}