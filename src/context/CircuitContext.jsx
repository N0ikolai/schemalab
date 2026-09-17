import { createContext, useState, useEffect, useMemo } from 'react';
import { PRESETS } from '../constants/presets.js';
import { solveCircuit } from '../engine/solveCircuit.js';

export const CircuitContext = createContext(null);

export function CircuitProvider({ children }) {
  const [circuit, setCircuit] = useState(() => {
    try {
      const raw = localStorage.getItem('schemalab_circuit_state_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.components && parsed.wires) return parsed;
      }
    } catch(e) {}
    return PRESETS[0].circuit;
  });

  const [tool, setTool] = useState('select');
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [selectedWireId, setSelectedWireId] = useState(null);
  const [simulationActive, setSimulationActive] = useState(true);

  // Сохранение в localStorage при каждом изменении схемы
  useEffect(() => {
    try {
      localStorage.setItem('schemalab_circuit_state_v1', JSON.stringify(circuit));
    } catch(e) {}
  }, [circuit]);

  // Запуск математического движка (пересчитывается только когда меняется схема)
  const solveResult = useMemo(() => {
    if (!simulationActive) return { success: true, nodeVoltages: {}, pinVoltages: {}, components: {} };
    return solveCircuit(circuit);
  }, [circuit, simulationActive]);

  return (
    <CircuitContext.Provider value={{
      circuit, setCircuit,
      tool, setTool,
      selectedComponentId, setSelectedComponentId,
      selectedWireId, setSelectedWireId,
      simulationActive, setSimulationActive,
      solveResult
    }}>
      {children}
    </CircuitContext.Provider>
  );
}