import { DisjointSet } from './DisjointSet.js';
import { solveMNA } from './solverMNA.js';
import { COMPONENT_CATALOG } from '../constants/componentCatalog.js';
import { getPinWorldPosition } from '../utils/geometry.js';

function pinKey(cid, pidx) { return `${cid}:${pidx}`; }

export function solveCircuit(circuit) {
  const { components, wires } = circuit;
  if (components.length === 0) {
    return { success: true, nodeVoltages: {}, pinVoltages: {}, components: {} };
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

  for (const wire of wires) {
    ds.union(pinKey(wire.from.componentId, wire.from.pinIndex), pinKey(wire.to.componentId, wire.to.pinIndex));
  }

  for (let i = 0; i < allPins.length; i++) {
    for (let j = i + 1; j < allPins.length; j++) {
      const p1 = allPins[i], p2 = allPins[j];
      if (Math.hypot(p1.worldX - p2.worldX, p1.worldY - p2.worldY) <= 6) {
        ds.union(p1.key, p2.key);
      }
    }
  }

  const groundPins = allPins.filter((p) => p.comp.kind === 'ground');
  if (groundPins.length === 0) {
    return {
      success: false,
      error: 'no-ground',
      errorMessageUk: 'У схемі відсутній опорний вузол Земля (GND). Додайте GND з лівої панелі та підключіть до кола.',
      nodeVoltages: {}, pinVoltages: {}, components: {},
    };
  }

  const groundRoots = new Set();
  groundPins.forEach((gp) => groundRoots.add(ds.find(gp.key)));

  const rootToNodeMap = new Map();
  let nextNode = 0;
  for (const pin of allPins) {
    const root = ds.find(pin.key);
    if (groundRoots.has(root)) {
      rootToNodeMap.set(root, -1);
    } else if (!rootToNodeMap.has(root)) {
      rootToNodeMap.set(root, nextNode++);
    }
  }

  const getPinNode = (comp, pinIdx) => {
    return rootToNodeMap.get(ds.find(pinKey(comp.id, pinIdx))) ?? -1;
  };

  const resistors = [];
  const vSources = [];
  const leds = [];

  for (const comp of components) {
    if (comp.kind === 'resistor') {
      resistors.push({ nodeA: getPinNode(comp, 0), nodeB: getPinNode(comp, 1), resistance: Math.max(comp.value, 1e-4) });
    } else if (comp.kind === 'voltmeter') {
      resistors.push({ nodeA: getPinNode(comp, 0), nodeB: getPinNode(comp, 1), resistance: 1e9 });
    } else if (comp.kind === 'battery') {
      vSources.push({ id: comp.id, nodePos: getPinNode(comp, 0), nodeNeg: getPinNode(comp, 1), voltage: comp.value });
    } else if (comp.kind === 'ammeter') {
      vSources.push({ id: comp.id, nodePos: getPinNode(comp, 0), nodeNeg: getPinNode(comp, 1), voltage: 0 });
    } else if (comp.kind === 'led') {
      leds.push({ id: comp.id, nodeAnode: getPinNode(comp, 0), nodeCathode: getPinNode(comp, 1), vf: Math.max(comp.value, 0.1), rs: 20 });
    }
  }

  const mnaRes = solveMNA({ nodeCount: nextNode, resistors, vSources, leds });
  if (!mnaRes.success) {
    return {
      success: false,
      error: mnaRes.error,
      errorMessageUk: mnaRes.errorMessageUk,
      nodeVoltages: {}, pinVoltages: {}, components: {}, iterations: mnaRes.iterations
    };
  }

  const nodeVoltages = { '-1': 0 };
  for (let i = 0; i < nextNode; i++) nodeVoltages[i] = mnaRes.nodeVoltages[i] ?? 0;

  const pinVoltages = {};
  for (const pin of allPins) {
    pinVoltages[pin.key] = nodeVoltages[getPinNode(pin.comp, pin.pinIndex)] ?? 0;
  }

  const compResults = {};
  let shortCircuit = false;

  for (const comp of components) {
    if (comp.kind === 'ground') {
      compResults[comp.id] = { voltage: 0, current: 0, power: 0 };
      continue;
    }
    const v0 = pinVoltages[pinKey(comp.id, 0)] ?? 0;
    const v1 = pinVoltages[pinKey(comp.id, 1)] ?? 0;
    const u = v0 - v1;
    let current = 0;
    let isLit = false;

    if (comp.kind === 'resistor') current = u / Math.max(comp.value, 1e-4);
    else if (comp.kind === 'voltmeter') current = u / 1e9;
    else if (comp.kind === 'battery') current = -(mnaRes.vSourceCurrents[comp.id] ?? 0);
    else if (comp.kind === 'ammeter') current = mnaRes.vSourceCurrents[comp.id] ?? 0;
    else if (comp.kind === 'led') {
      const lState = mnaRes.ledStates[comp.id];
      if (lState) {
        current = lState.current;
        isLit = lState.isOpen && current >= 0.0005;
      }
    }

    const power = Math.abs(u * current);
    let warning;
    if (Math.abs(current) > 1e4) {
      shortCircuit = true;
      warning = 'Коротке замикання! Струм > 10 кА';
    }

    compResults[comp.id] = { voltage: u, current, power, isLit, warning };
  }

  return {
    success: true,
    nodeVoltages,
    pinVoltages,
    components: compResults,
    iterations: mnaRes.iterations,
    error: shortCircuit ? 'short-circuit' : undefined,
    errorMessageUk: shortCircuit ? 'Увага: у колі зафіксовано коротке замикання (струм > 10 кА)!' : undefined,
  };
}