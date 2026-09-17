import { solveGaussPartialPivoting } from './solverGauss.js';

export function solveMNA(netlist) {
  const { nodeCount, resistors, vSources, leds } = netlist;
  const numVSources = vSources.length;
  const systemSize = nodeCount + numVSources;

  if (systemSize === 0) {
    return { success: true, nodeVoltages: [], vSourceCurrents: {}, ledStates: {}, iterations: 0 };
  }

  const ledOpenState = {};
  leds.forEach((led) => { ledOpenState[led.id] = false; });

  const MAX_ITERATIONS = 60;
  let lastX = [];
  let iter = 0;

  for (iter = 0; iter < MAX_ITERATIONS; iter++) {
    const A = Array.from({ length: systemSize }, () => new Array(systemSize).fill(0));
    const b = new Array(systemSize).fill(0);

    // gmin
    for (let i = 0; i < nodeCount; i++) {
      A[i][i] += 1e-9;
    }

    // Резистори та вольтметри
    for (const r of resistors) {
      const g = 1 / Math.max(r.resistance, 1e-9);
      const a = r.nodeA;
      const bNode = r.nodeB;
      if (a >= 0) A[a][a] += g;
      if (bNode >= 0) A[bNode][bNode] += g;
      if (a >= 0 && bNode >= 0) {
        A[a][bNode] -= g;
        A[bNode][a] -= g;
      }
    }

    // Світлодіоди
    for (const led of leds) {
      const isOpen = ledOpenState[led.id];
      const a = led.nodeAnode;
      const bNode = led.nodeCathode;
      if (isOpen) {
        const g = 1 / Math.max(led.rs, 1e-3);
        if (a >= 0) A[a][a] += g;
        if (bNode >= 0) A[bNode][bNode] += g;
        if (a >= 0 && bNode >= 0) {
          A[a][bNode] -= g;
          A[bNode][a] -= g;
        }
        if (a >= 0) b[a] += g * led.vf;
        if (bNode >= 0) b[bNode] -= g * led.vf;
      } else {
        const gOff = 1e-9;
        if (a >= 0) A[a][a] += gOff;
        if (bNode >= 0) A[bNode][bNode] += gOff;
        if (a >= 0 && bNode >= 0) {
          A[a][bNode] -= gOff;
          A[bNode][a] -= gOff;
        }
      }
    }

    // Джерела напруги та амперметри
    for (let k = 0; k < numVSources; k++) {
      const vs = vSources[k];
      const row = nodeCount + k;
      const a = vs.nodePos;
      const bNode = vs.nodeNeg;
      if (a >= 0) {
        A[a][row] += 1;
        A[row][a] += 1;
      }
      if (bNode >= 0) {
        A[bNode][row] -= 1;
        A[row][bNode] -= 1;
      }
      b[row] = vs.voltage;
    }

    const solveRes = solveGaussPartialPivoting(A, b);
    if (!solveRes.success) {
      return {
        success: false,
        error: 'singular',
        errorMessageUk: `Помилка розрахунку: ${solveRes.error}. Перевірте замкненість схеми та контакти.`,
        nodeVoltages: [],
        vSourceCurrents: {},
        ledStates: {},
        iterations: iter + 1,
      };
    }

    lastX = solveRes.x;
    if (leds.length === 0) break;

    let stateChanged = false;
    for (const led of leds) {
      const vA = led.nodeAnode >= 0 ? lastX[led.nodeAnode] : 0;
      const vB = led.nodeCathode >= 0 ? lastX[led.nodeCathode] : 0;
      const vDrop = vA - vB;
      const wasOpen = ledOpenState[led.id];
      let willBeOpen = wasOpen;

      if (wasOpen) {
        const current = (vDrop - led.vf) / led.rs;
        if (current <= 1e-7) willBeOpen = false;
      } else {
        if (vDrop > led.vf) willBeOpen = true;
      }

      if (willBeOpen !== wasOpen) {
        ledOpenState[led.id] = willBeOpen;
        stateChanged = true;
      }
    }

    if (!stateChanged) break;
  }

  const nodeVoltages = [];
  for (let i = 0; i < nodeCount; i++) nodeVoltages.push(lastX[i] || 0);

  const vSourceCurrents = {};
  for (let k = 0; k < numVSources; k++) {
    vSourceCurrents[vSources[k].id] = lastX[nodeCount + k] || 0;
  }

  const finalLedStates = {};
  for (const led of leds) {
    const vA = led.nodeAnode >= 0 ? nodeVoltages[led.nodeAnode] : 0;
    const vB = led.nodeCathode >= 0 ? nodeVoltages[led.nodeCathode] : 0;
    const vDrop = vA - vB;
    const isOpen = ledOpenState[led.id];
    const current = isOpen ? Math.max(0, (vDrop - led.vf) / led.rs) : 0;
    finalLedStates[led.id] = { isOpen, current, vDrop };
  }

  return {
    success: true,
    nodeVoltages,
    vSourceCurrents,
    ledStates: finalLedStates,
    iterations: iter + 1,
  };
}