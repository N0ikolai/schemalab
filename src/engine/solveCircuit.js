import { DisjointSet } from './DisjointSet.js';
import { solveMNA } from './solverMNA.js';
import { COMPONENT_CATALOG } from '../constants/componentCatalog.js';
import { getPinWorldPosition } from '../utils/geometry.js';

function pinKey(cid, pidx) { return `${cid}:${pidx}`; }

// Глобальна пам'ять для реактивних елементів
const transientState = { time: 0, lastDt: 0.016, vCap: {}, iInd: {} };

export function solveCircuit(circuit, time = 0) {
  const { components, wires } = circuit;
  if (components.length === 0) return { success: true, nodeVoltages: {}, pinVoltages: {}, components: {}, wires: {} };

  // Захист від подвійного виклику в межах одного кадру (Canvas + Осцилограф)
  const isSameFrame = Math.abs(time - transientState.time) < 0.0001;
  let dt = time - transientState.time;
  if (isSameFrame) { dt = transientState.lastDt; } 
  else {
    if (dt <= 0) dt = 0.016;
    if (dt > 0.05) dt = 0.016; // Запобіжник від вибуху симуляції при лагах браузера
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
    if (comp.kind === 'resistor') resistors.push({ nodeA: getPinNode(comp, 0), nodeB: getPinNode(comp, 1), resistance: Math.max(comp.value, 1e-4) });
    else if (comp.kind === 'switch') resistors.push({ nodeA: getPinNode(comp, 0), nodeB: getPinNode(comp, 1), resistance: comp.value === 1 ? 1e-4 : 1e9 });
    else if (comp.kind === 'voltmeter') resistors.push({ nodeA: getPinNode(comp, 0), nodeB: getPinNode(comp, 1), resistance: 1e9 });
    else if (comp.kind === 'battery') vSources.push({ id: comp.id, nodePos: getPinNode(comp, 0), nodeNeg: getPinNode(comp, 1), voltage: comp.value });
    else if (comp.kind === 'ac_source') {
      const acVoltage = comp.value * Math.sin(2 * Math.PI * 1 * time);
      vSources.push({ id: comp.id, nodePos: getPinNode(comp, 0), nodeNeg: getPinNode(comp, 1), voltage: acVoltage });
    }
    else if (comp.kind === 'ammeter') vSources.push({ id: comp.id, nodePos: getPinNode(comp, 0), nodeNeg: getPinNode(comp, 1), voltage: 0 });
    else if (comp.kind === 'led' || comp.kind === 'diode') leds.push({ id: comp.id, nodeAnode: getPinNode(comp, 0), nodeCathode: getPinNode(comp, 1), vf: Math.max(comp.value, 0.1), rs: comp.kind === 'diode' ? 1 : 20 });
    else if (comp.kind === 'relay') relays.push({ id: comp.id, nodeCoilPos: getPinNode(comp, 0), nodeCoilNeg: getPinNode(comp, 1), nodeSw1: getPinNode(comp, 2), nodeSw2: getPinNode(comp, 3), vOn: Math.max(comp.value, 0.1) });
    else if (comp.kind === 'npn') {
      leds.push({ id: `${comp.id}_be`, nodeAnode: getPinNode(comp, 0), nodeCathode: getPinNode(comp, 2), vf: 0.7, rs: 100 });
      relays.push({ id: comp.id, nodeCoilPos: getPinNode(comp, 0), nodeCoilNeg: getPinNode(comp, 2), nodeSw1: getPinNode(comp, 1), nodeSw2: getPinNode(comp, 2), vOn: 0.65 });
    }
    else if (comp.kind === 'capacitor') {
      const c = Math.max(comp.value, 1e-12);
      const req = dt / c;
      const vPrev = transientState.vCap[comp.id] || 0;
      resistors.push({ nodeA: getPinNode(comp, 0), nodeB: getPinNode(comp, 1), resistance: req });
      iSources.push({ nodePos: getPinNode(comp, 0), nodeNeg: getPinNode(comp, 1), current: -vPrev / req });
    }
    else if (comp.kind === 'inductor') {
      const l = Math.max(comp.value, 1e-9);
      const req = l / dt;
      const iPrev = transientState.iInd[comp.id] || 0;
      resistors.push({ nodeA: getPinNode(comp, 0), nodeB: getPinNode(comp, 1), resistance: req });
      iSources.push({ nodePos: getPinNode(comp, 0), nodeNeg: getPinNode(comp, 1), current: iPrev });
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
    const v0 = pinVoltages[pinKey(comp.id, 0)] ?? 0, v1 = pinVoltages[pinKey(comp.id, 1)] ?? 0;
    const u = v0 - v1;
    let current = 0, isLit = false;

    if (comp.kind === 'resistor') current = u / Math.max(comp.value, 1e-4);
    else if (comp.kind === 'switch') current = u / (comp.value === 1 ? 1e-4 : 1e9);
    else if (comp.kind === 'voltmeter') current = u / 1e9;
    else if (comp.kind === 'battery' || comp.kind === 'ac_source') current = -(mnaRes.vSourceCurrents[comp.id] ?? 0);
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
      if (!isSameFrame) transientState.vCap[comp.id] = u; // Оновлюємо стан конденсатора
    } else if (comp.kind === 'inductor') {
      const req = Math.max(comp.value, 1e-9) / dt;
      current = u / req + (transientState.iInd[comp.id] || 0);
      if (!isSameFrame) transientState.iInd[comp.id] = current; // Оновлюємо стан котушки
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