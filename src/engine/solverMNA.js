import { solveGaussPartialPivoting } from './solverGauss.js';

export function solveMNA(netlist) {
  const { nodeCount, resistors, vSources, leds, relays = [] } = netlist;
  const numVSources = vSources.length;
  const systemSize = nodeCount + numVSources;

  if (systemSize === 0) return { success: true, nodeVoltages: [], vSourceCurrents: {}, ledStates: {}, relayStates: {}, iterations: 0 };

  const ledOpenState = {}, relayClosedState = {};
  leds.forEach(led => ledOpenState[led.id] = false);
  relays.forEach(rel => relayClosedState[rel.id] = false);

  const MAX_ITERATIONS = 60;
  let lastX = [], iter = 0;

  for (iter = 0; iter < MAX_ITERATIONS; iter++) {
    const A = Array.from({ length: systemSize }, () => new Array(systemSize).fill(0));
    const b = new Array(systemSize).fill(0);

    for (let i = 0; i < nodeCount; i++) A[i][i] += 1e-9;

    for (const r of resistors) {
      const g = 1 / Math.max(r.resistance, 1e-9), a = r.nodeA, bNode = r.nodeB;
      if (a >= 0) A[a][a] += g;
      if (bNode >= 0) A[bNode][bNode] += g;
      if (a >= 0 && bNode >= 0) { A[a][bNode] -= g; A[bNode][a] -= g; }
    }

    for (const led of leds) {
      const isOpen = ledOpenState[led.id], a = led.nodeAnode, bNode = led.nodeCathode;
      if (isOpen) {
        const g = 1 / Math.max(led.rs, 1e-3);
        if (a >= 0) A[a][a] += g;
        if (bNode >= 0) A[bNode][bNode] += g;
        if (a >= 0 && bNode >= 0) { A[a][bNode] -= g; A[bNode][a] -= g; }
        if (a >= 0) b[a] += g * led.vf;
        if (bNode >= 0) b[bNode] -= g * led.vf;
      } else {
        const gOff = 1e-9;
        if (a >= 0) A[a][a] += gOff;
        if (bNode >= 0) A[bNode][bNode] += gOff;
        if (a >= 0 && bNode >= 0) { A[a][bNode] -= gOff; A[bNode][a] -= gOff; }
      }
    }

    for (const rel of relays) {
      const gCoil = 1 / 400, cA = rel.nodeCoilPos, cB = rel.nodeCoilNeg;
      if (cA >= 0) A[cA][cA] += gCoil;
      if (cB >= 0) A[cB][cB] += gCoil;
      if (cA >= 0 && cB >= 0) { A[cA][cB] -= gCoil; A[cB][cA] -= gCoil; }

      const isClosed = relayClosedState[rel.id], gSw = isClosed ? 1 / 1e-3 : 1e-9, sA = rel.nodeSw1, sB = rel.nodeSw2;
      if (sA >= 0) A[sA][sA] += gSw;
      if (sB >= 0) A[sB][sB] += gSw;
      if (sA >= 0 && sB >= 0) { A[sA][sB] -= gSw; A[sB][sA] -= gSw; }
    }

    for (let k = 0; k < numVSources; k++) {
      const vs = vSources[k], row = nodeCount + k, a = vs.nodePos, bNode = vs.nodeNeg;
      if (a >= 0) { A[a][row] += 1; A[row][a] += 1; }
      if (bNode >= 0) { A[bNode][row] -= 1; A[row][bNode] -= 1; }
      b[row] = vs.voltage;
    }

    const solveRes = solveGaussPartialPivoting(A, b);
    if (!solveRes.success) return { success: false, error: 'singular', errorMessageUk: `Помилка розрахунку. Перевірте контакти.`, nodeVoltages: [], vSourceCurrents: {}, ledStates: {}, relayStates: {}, iterations: iter + 1 };
    lastX = solveRes.x;

    if (leds.length === 0 && relays.length === 0) break;
    let stateChanged = false;

    for (const led of leds) {
      const vA = led.nodeAnode >= 0 ? lastX[led.nodeAnode] : 0, vB = led.nodeCathode >= 0 ? lastX[led.nodeCathode] : 0, vDrop = vA - vB;
      const wasOpen = ledOpenState[led.id];
      let willBeOpen = wasOpen;
      if (wasOpen) { if ((vDrop - led.vf) / led.rs <= 1e-7) willBeOpen = false; } 
      else { if (vDrop > led.vf) willBeOpen = true; }
      if (willBeOpen !== wasOpen) { ledOpenState[led.id] = willBeOpen; stateChanged = true; }
    }

    for (const rel of relays) {
      const vC1 = rel.nodeCoilPos >= 0 ? lastX[rel.nodeCoilPos] : 0, vC2 = rel.nodeCoilNeg >= 0 ? lastX[rel.nodeCoilNeg] : 0, vDrop = Math.abs(vC1 - vC2);
      const wasClosed = relayClosedState[rel.id], willBeClosed = vDrop >= rel.vOn;
      if (wasClosed !== willBeClosed) { relayClosedState[rel.id] = willBeClosed; stateChanged = true; }
    }

    if (!stateChanged) break;
  }

  const nodeVoltages = [];
  for (let i = 0; i < nodeCount; i++) nodeVoltages.push(lastX[i] || 0);

  const vSourceCurrents = {};
  for (let k = 0; k < numVSources; k++) vSourceCurrents[vSources[k].id] = lastX[nodeCount + k] || 0;

  const finalLedStates = {}, finalRelayStates = {};
  for (const led of leds) {
    const vA = led.nodeAnode >= 0 ? nodeVoltages[led.nodeAnode] : 0, vB = led.nodeCathode >= 0 ? nodeVoltages[led.nodeCathode] : 0, isOpen = ledOpenState[led.id];
    finalLedStates[led.id] = { isOpen, current: isOpen ? Math.max(0, (vA - vB - led.vf) / led.rs) : 0 };
  }
  for (const rel of relays) finalRelayStates[rel.id] = { isClosed: relayClosedState[rel.id] };

  return { success: true, nodeVoltages, vSourceCurrents, ledStates: finalLedStates, relayStates: finalRelayStates, iterations: iter + 1 };
}