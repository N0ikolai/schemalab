import { useContext, useState } from 'react';
import { CircuitContext } from '../context/CircuitContext.jsx';
import { COMPONENT_CATALOG } from '../constants/componentCatalog.js';

const CATEGORIES = [
  { id: 'source', nameUk: 'Джерела живлення' },
  { id: 'passive', nameUk: 'Пасивні елементи' },
  { id: 'logic', nameUk: 'Логіка та Комутація' },
  { id: 'measure', nameUk: 'Вимірювальні прилади' },
];

export function Sidebar({ onShowToast, tutorialStep }) {
  const { circuit, setCircuit, setSelectedComponentId, setSelectedWireId } = useContext(CircuitContext);
  
  const [openCategories, setOpenCategories] = useState({
    source: true, passive: true, logic: true, measure: true
  });

  const toggleCategory = (id) => setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));

  const handleAddComponent = (kind) => {
    const meta = COMPONENT_CATALOG[kind];
    const count = circuit.components.filter(c => c.kind === kind).length;
    const label = `${meta.defaultLabelPrefix}${count + 1}`;
    const offset = (circuit.components.length % 5) * 20;
    const newComp = {
      id: `${kind}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      kind, x: 340 + offset, y: 260 + offset,
      rotation: kind === 'battery' || kind === 'resistor' || kind === 'capacitor' || kind === 'inductor' || kind === 'ac_source' ? 90 : 0,
      value: meta.defaultValue, label,
      ledColor: kind === 'led' ? 'red' : undefined,
    };
    setCircuit(prev => ({ ...prev, components: [...prev.components, newComp] }));
    setSelectedComponentId(newComp.id);
    setSelectedWireId(null);
    onShowToast(`Додано: ${meta.nameUk} (${label})`);
  };

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden select-none shrink-0">
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Палітра компонентів</h2>
        <div className="space-y-4">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="space-y-2">
              <button 
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-sky-400 bg-slate-800/40 p-2 rounded transition-colors"
              >
                <span>{cat.nameUk}</span>
                <span className="text-[10px] text-slate-500">{openCategories[cat.id] ? '▼' : '▶'}</span>
              </button>
              
              {openCategories[cat.id] && (
                <div className="grid grid-cols-2 gap-2 pl-1">
                  {Object.values(COMPONENT_CATALOG).filter(c => c.category === cat.id).map(item => {
                    
                    const isTarget = 
                      (tutorialStep === 1 && item.kind === 'battery') ||
                      (tutorialStep === 2 && item.kind === 'resistor') ||
                      (tutorialStep === 3 && item.kind === 'led') ||
                      (tutorialStep === 4 && item.kind === 'ground');

                    return (
                      <button 
                        key={item.kind} 
                        onClick={() => handleAddComponent(item.kind)} 
                        className={`flex items-center space-x-2 p-1.5 rounded-lg border text-left transition-all ${
                          isTarget 
                            ? 'bg-sky-900/40 border-sky-400 ring-2 ring-sky-400/50 animate-pulse' 
                            : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 hover:border-sky-500/50'
                        }`}
                      >
                        <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-sky-400 text-xs font-bold font-mono shrink-0">
                          {item.defaultLabelPrefix[0]}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-[11px] font-medium text-slate-200 truncate leading-tight">{item.nameUk}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}