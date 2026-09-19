import { useContext } from 'react';
import { CircuitContext } from '../context/CircuitContext.jsx';
import { COMPONENT_CATALOG } from '../constants/componentCatalog.js';
import { formatVoltage, formatCurrent } from '../utils/formatters.js';
import { Oscilloscope } from './Oscilloscope.jsx';

export function PropertiesPanel({ onShowToast }) {
  const {
    circuit, setCircuit,
    selectedComponentId, selectedWireId,
    setSelectedComponentId, setSelectedWireId,
    solveResult,
  } = useContext(CircuitContext);

  const selectedComponent = circuit.components.find(c => c.id === selectedComponentId);
  const selectedWire = circuit.wires.find(w => w.id === selectedWireId);

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

  const handleToggleSwitch = () => {
    setCircuit(prev => ({
      ...prev,
      components: prev.components.map(c => c.id === selectedComponent.id ? { ...c, value: c.value === 1 ? 0 : 1 } : c)
    }));
  };

  const handleRotateComponent = () => {
    setCircuit(prev => ({
      ...prev,
      components: prev.components.map(c => c.id === selectedComponent.id ? { ...c, rotation: (c.rotation + 90) % 360 } : c)
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

  if (!selectedComponent && !selectedWire) {
    return (
      <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0 select-none">
        <div className="p-4 text-slate-400 text-xs flex-1">
          <h2 className="font-bold text-slate-300 uppercase tracking-wider mb-2">Властивості</h2>
          <p className="text-slate-500 italic">Оберіть елемент або провід на схемі</p>
        </div>
        <SchemeStatusFooter circuit={circuit} solveResult={solveResult} />
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0 select-none">
      <div className="p-4 flex-1 overflow-y-auto">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Властивості</h2>

        {selectedComponent && meta && (
          <div className="space-y-4">
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
                <div className="flex justify-between mb-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Номінал ({meta.unit})</label>
                </div>
                <input
                  type="number"
                  step="any"
                  value={selectedComponent.value}
                  onChange={handleValueChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            )}

            {/* Налаштування кількості входів для вентилів І та ІЛИ */}
            {['and', 'or'].includes(selectedComponent.kind) && (
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Кількість входів</label>
                <select
                  value={selectedComponent.inputsCount || 2}
                  onChange={(e) => {
                    const cnt = parseInt(e.target.value);
                    setCircuit(prev => ({
                      ...prev,
                      components: prev.components.map(c => {
                        if (c.id !== selectedComponent.id) return c;
                        const newPins = [];
                        for (let i = 0; i < cnt; i++) {
                          const yPos = -15 + (30 / (cnt - 1 || 1)) * i;
                          newPins.push({ index: i, x: -30, y: yPos, label: `IN${i + 1}` });
                        }
                        newPins.push({ index: cnt, x: 30, y: 0, label: 'OUT' });
                        return { ...c, inputsCount: cnt, pins: newPins };
                      })
                    }));
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value={2}>2 входи</option>
                  <option value={3}>3 входи</option>
                  <option value={4}>4 входи</option>
                </select>
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

            {/* Живий графік напруги */}
            {selectedComponent.kind !== 'ground' && (
              <div className="pt-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Графік напруги (Live):</div>
                <Oscilloscope circuit={circuit} selectedCompId={selectedComponent.id} />
              </div>
            )}

            {/* Числовий знімок напруги/струму */}
            {solveResult?.success && solveResult.components?.[selectedComponent.id] && (
              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-400">Показники (Останній знімок):</div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Напруга:</span>
                  <span className="font-mono font-bold text-sky-400">{formatVoltage(solveResult.components[selectedComponent.id].voltage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Струм:</span>
                  <span className="font-mono font-bold text-emerald-400">{formatCurrent(solveResult.components[selectedComponent.id].current)}</span>
                </div>
              </div>
            )}

            <div className="pt-2 text-[11px] text-slate-400 bg-slate-800/40 p-2.5 rounded border border-slate-800">
              {meta.descriptionUk}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleRotateComponent}
                className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
              >
                Поворот (R)
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs border border-rose-900/50"
              >
                Видалити
              </button>
            </div>
          </div>
        )}

        {selectedWire && (
          <div className="space-y-3 text-xs bg-slate-950 p-3 rounded-lg border border-slate-700">
            <div className="font-bold text-sky-400 mb-2">З'єднувальний провід</div>
            <div className="text-slate-400 mb-4">Передає струм між елементами. Опір: 0.00001 Ом.</div>
            <button
              onClick={handleDelete}
              className="w-full py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
            >
              Видалити провід
            </button>
          </div>
        )}
      </div>

      <SchemeStatusFooter circuit={circuit} solveResult={solveResult} />
    </aside>
  );
}

function SchemeStatusFooter({ circuit, solveResult }) {
  return (
    <div className="p-4 bg-slate-950/40 border-t border-slate-800 shrink-0 text-xs space-y-1.5">
      <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Статус схеми</div>
      {solveResult?.success ? (
        <>
          <div className="text-emerald-400 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Схему розв'язано успішно</span>
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between">
            <span>Елементів: {circuit.components.length}</span>
            <span>Провідників: {circuit.wires.length}</span>
          </div>
        </>
      ) : (
        <div className="text-rose-400 text-[11px]">{solveResult?.errorMessageUk}</div>
      )}
    </div>
  );
}