import { DisjointSet } from './DisjointSet.js';
import { solveMNA } from './solverMNA.js';
import { COMPONENT_CATALOG } from '../constants/componentCatalog.js';
import { getPinWorldPosition } from '../utils/geometry.js';

function pinKey(cid, pidx) { return `${cid}:${pidx}`; }

const transientState = { time: 0, lastDt: 0.016, vCap: {}, iInd: {} };

export function resetSimulation() {
  transientState.time = 0;
  transientState.lastDt = 0.016;
  transientState.vCap = {};
  transientState.iInd = {};
}

export function solveCircuit(circuit, time = 0) {
  const { components, wires } = circuit;
  if (components.length === 0) return { success: true, nodeVoltages: {}, pinVoltages: {}, components: {}, wires: {} };

  const isSameFrame = Math.abs(time - transientState.time) < 0.0001;
  let dt = time - transientState.time;
  if (isSameFrame) { dt = transientState.lastDt; } 
  else {
    if (dt <= 0) dt = 0.016;
    if (dt > 0.05) dt = 0.016;
  }

  const ds = new DisjointSet();
  const allPins = [];

  for (const comp of components) {
    const meta = COMPONENT_CATALOG[comp.kind];
    for (const pin of meta.pins) {
      const key = pinKey(comp.id, pin.index);
      const pos = getPinWorldPosition(comp, pin.index);
      allPins.push({ key, comp, pinIndex: pin.index, worldX: pos.x, worldY: pos.y });
      ds.find(key);
    }
  }

  for (let i = 0; i < allPins.length; i++) {
    for (let j = i + 1; j < allPins.length; j++) {
      const p1 = allPins[i], p2 = allPins[j];
      if (Math.hypot(p1.worldX - p2.worldX, p1.worldY - p2.worldY) <= 6) ds.union(p1.key, p2.key);
    }
  }

  const groundPins = allPins.filter((p) => p.comp.kind === 'ground');
  if (groundPins.length === 0) return { success: false, error: 'no-ground', errorMessageUk: 'Додайте GND.', nodeVoltages: {}, pinVoltages: {}, components: {}, wires: {} };

  const groundRoots = new Set();
  groundPins.forEach((gp) => groundRoots.add(ds.find(gp.key)));

  const rootToNodeMap = new Map();
  let nextNode = 0;
  for (const pin of allPins) {
    const root = ds.find(pin.key);
    if (groundRoots.has(root)) rootToNodeMap.set(root, -1);
    else if (!rootToNodeMap.has(root)) rootToNodeMap.set(root, nextNode++);
  }

  const getPinNode = (c, p) => rootToNodeMap.get(ds.find(pinKey(c.id, p))) ?? -1;
  const getWirePinNode = (wirePin) => rootToNodeMap.get(ds.find(pinKey(wirePin.componentId, wirePin.pinIndex))) ?? -1;

  const resistors = [], vSources = [], iSources = [], leds = [], relays = [];

  for (const wire of wires) {
    resistors.push({ nodeA: getWirePinNode(wire.from), nodeB: getWirePinNode(wire.to), resistance: 1e-5 });
  }

  for (const comp of components) {
   if (comp.kind === 'resistor') {
          ctx.strokeStyle = '#e2e8f0'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-18, 0); ctx.lineTo(-14, -10); ctx.lineTo(-8, 10); ctx.lineTo(-2, -10); ctx.lineTo(4, 10); ctx.lineTo(10, -10); ctx.lineTo(14, 10); ctx.lineTo(18, 0); ctx.lineTo(30, 0); ctx.stroke();
        } else if (comp.kind === 'capacitor') {
          ctx.strokeStyle = '#e2e8f0'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-4, 0); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(30, 0); ctx.stroke();
          ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, -12); ctx.lineTo(-4, 12); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(4, -12); ctx.lineTo(4, 12); ctx.stroke();
        } else if (comp.kind === 'inductor') {
          ctx.strokeStyle = '#e2e8f0'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-15, 0);
          ctx.bezierCurveTo(-15, -12, -5, -12, -5, 0); ctx.bezierCurveTo(-5, -12, 5, -12, 5, 0); ctx.bezierCurveTo(5, -12, 15, -12, 15, 0);
          ctx.lineTo(30, 0); ctx.stroke();
        } else if (comp.kind === 'battery') {
          ctx.strokeStyle = '#e2e8f0'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-8, 0); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-8, -18); ctx.lineTo(-8, 18); ctx.lineWidth = 3; ctx.strokeStyle = '#38bdf8'; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(8, 10); ctx.lineWidth = 5; ctx.strokeStyle = '#ef4444'; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(30, 0); ctx.lineWidth = 2.2; ctx.strokeStyle = '#e2e8f0'; ctx.stroke();
        } else if (comp.kind === 'ac_source') {
          ctx.strokeStyle = '#e2e8f0'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-16, 0); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(30, 0); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-10, 0); ctx.bezierCurveTo(-5, -12, -5, 12, 0, 0); ctx.bezierCurveTo(5, -12, 5, 12, 10, 0); ctx.stroke();
        } else if (comp.kind === 'clock') {
          ctx.strokeStyle = '#e2e8f0'; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, -20); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(0, 20); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-8, 6); ctx.lineTo(-8, -6); ctx.lineTo(0, -6); ctx.lineTo(0, 6); ctx.lineTo(8, 6); ctx.stroke();
        } else if (comp.kind === 'vcc') {
          ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 20); ctx.stroke();
          ctx.fillStyle = '#ef4444'; ctx.font = 'bold 12px monospace'; ctx.fillText('+Vcc', 0, -10);
        } else if (comp.kind === 'probe') {
          ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-12, 0); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2);
          if (sim?.isLit) { ctx.fillStyle = '#ef4444'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 15; } else { ctx.fillStyle = '#1e293b'; }
          ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
          if (sim?.isLit) { ctx.fillStyle = '#ffffff'; ctx.font = 'bold 14px monospace'; ctx.fillText('1', 0, 4); }
          else { ctx.fillStyle = '#64748b'; ctx.font = 'bold 14px monospace'; ctx.fillText('0', 0, 4); }
        } else if (comp.kind === 'switch') {
          ctx.strokeStyle = '#e2e8f0'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-12, 0);
          if (comp.value === 1) ctx.lineTo(12, 0); else ctx.lineTo(12, -14);
          ctx.moveTo(12, 0); ctx.lineTo(30, 0); ctx.stroke();
          ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(-12, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.arc(12, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        } else if (comp.kind === 'diode' || comp.kind === 'led') {
          ctx.strokeStyle = '#e2e8f0'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-12, 0); ctx.moveTo(12, 0); ctx.lineTo(30, 0); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-12, -14); ctx.lineTo(12, 0); ctx.lineTo(-12, 14); ctx.closePath();
          if (comp.kind === 'led' && sim?.isLit) { ctx.fillStyle = '#ef4444'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 20; } else { ctx.fillStyle = '#1e293b'; }
          ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.moveTo(12, -14); ctx.lineTo(12, 14); ctx.lineWidth = 2.5; ctx.stroke();
        } else if (comp.kind === 'ground') {
          ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, 0); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.moveTo(-10, 6); ctx.lineTo(10, 6); ctx.moveTo(-4, 12); ctx.lineTo(4, 12); ctx.stroke();
        }
  }

  const mnaRes = solveMNA({ nodeCount: nextNode, resistors, vSources, iSources, leds, relays });
  if (!mnaRes.success) return { success: false, errorMessageUk: mnaRes.errorMessageUk, nodeVoltages: {}, pinVoltages: {}, components: {}, wires: {} };

  const pinVoltages = {};
  for (const pin of allPins) pinVoltages[pin.key] = mnaRes.nodeVoltages[getPinNode(pin.comp, pin.pinIndex)] ?? 0;

  const compResults = {};
  let shortCircuit = false;

  for (const comp of components) {
    if (comp.kind === 'ground') { compResults[comp.id] = { voltage: 0, current: 0, power: 0 }; continue; }
    
    let u = 0, current = 0, isLit = false;

    if (comp.kind === 'vcc') {
      u = 5;
      current = -(mnaRes.vSourceCurrents[comp.id] ?? 0);
    } else if (comp.kind === 'probe') {
      u = pinVoltages[pinKey(comp.id, 0)] ?? 0;
      current = u / 1e9;
      isLit = u > 2.5; // Логічна 1
    } else {
      const v0 = pinVoltages[pinKey(comp.id, 0)] ?? 0, v1 = pinVoltages[pinKey(comp.id, 1)] ?? 0;
      u = v0 - v1;

      if (comp.kind === 'resistor') current = u / Math.max(comp.value, 1e-4);
      else if (comp.kind === 'switch') current = u / (comp.value === 1 ? 1e-4 : 1e9);
      else if (comp.kind === 'voltmeter') current = u / 1e9;
      else if (comp.kind === 'battery' || comp.kind === 'ac_source') current = -(mnaRes.vSourceCurrents[comp.id] ?? 0);
      else if (comp.kind === 'clock') current = -(mnaRes.vSourceCurrents[comp.id] ?? 0);
      else if (comp.kind === 'ammeter') current = mnaRes.vSourceCurrents[comp.id] ?? 0;
      else if (comp.kind === 'led' || comp.kind === 'diode') {
        const lState = mnaRes.ledStates[comp.id];
        if (lState) { current = lState.current; isLit = lState.isOpen && current >= 0.0005; }
      } else if (comp.kind === 'relay') {
        const rState = mnaRes.relayStates[comp.id];
        isLit = rState ? rState.isClosed : false;
        current = Math.abs(u) / 400; 
      } else if (comp.kind === 'npn') {
        const rState = mnaRes.relayStates[comp.id];
        isLit = rState ? rState.isClosed : false;
        current = 0; 
      } else if (comp.kind === 'capacitor') {
        const req = dt / Math.max(comp.value, 1e-12);
        current = u / req - (transientState.vCap[comp.id] || 0) / req;
        if (!isSameFrame) transientState.vCap[comp.id] = u;
      } else if (comp.kind === 'inductor') {
        const req = Math.max(comp.value, 1e-9) / dt;
        current = u / req + (transientState.iInd[comp.id] || 0);
        if (!isSameFrame) transientState.iInd[comp.id] = current;
      }
    }

    if (Math.abs(current) > 1e4) shortCircuit = true;
    compResults[comp.id] = { voltage: u, current, power: Math.abs(u * current), isLit };
  }

  if (!isSameFrame) {
    transientState.lastDt = dt;
    transientState.time = time;
  }

  const wireResults = {};
  for (const wire of wires) {
    const v0 = pinVoltages[pinKey(wire.from.componentId, wire.from.pinIndex)] ?? 0;
    const v1 = pinVoltages[pinKey(wire.to.componentId, wire.to.pinIndex)] ?? 0;
    const current = (v0 - v1) / 1e-5;
    wireResults[wire.id] = { current };
    if (Math.abs(current) > 1e4) shortCircuit = true;
  }

  return { success: true, pinVoltages, components: compResults, wires: wireResults, errorMessageUk: shortCircuit ? 'Коротке замикання!' : undefined };
}