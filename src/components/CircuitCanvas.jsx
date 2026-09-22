import { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { CircuitContext } from '../context/CircuitContext.jsx';
import { COMPONENT_CATALOG, GRID_SIZE } from '../constants/componentCatalog.js';
import { getPinWorldPosition } from '../utils/geometry.js';
import { formatVoltage, formatCurrent } from '../utils/formatters.js';
import { solveCircuit as runSimulation } from '../engine/solveCircuit.js';

function pinKey(cid, pidx) { return `${cid}:${pidx}`; }

const distToSegmentSquared = (p, v, w) => {
  const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
  if (l2 === 0) return (p.x - v.x)**2 + (p.y - v.y)**2;
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (p.x - (v.x + t * (w.x - v.x)))**2 + (p.y - (v.y + t * (w.y - v.y)))**2;
};

export function CircuitCanvas({ onShowToast, tutorialStep }) {
  const { circuit, setCircuit, tool, selectedComponentId, setSelectedComponentId, selectedWireId, setSelectedWireId, solveResult } = useContext(CircuitContext);
  const canvasRef = useRef(null);
  const [transform, setTransform] = useState({ scale: 1, offsetX: 60, offsetY: 60 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingCompId, setDraggingCompId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [wireStartPin, setWireStartPin] = useState(null);
  const [mouseWorldPos, setMouseWorldPos] = useState({ x: 0, y: 0 });
  const [hoveredPin, setHoveredPin] = useState(null);

  const screenToWorld = useCallback((sx, sy) => ({ x: (sx - transform.offsetX) / transform.scale, y: (sy - transform.offsetY) / transform.scale }), [transform]);

  const getVoltageColor = (v) => {
    if (v === undefined || isNaN(v)) return '#64748b';
    if (Math.abs(v) < 0.05) return '#06b6d4';
    if (v < 0) return '#3b82f6';
    if (v <= 2.5) return '#10b981
    if (v <= 6) return '#eab308';
    if (v <= 12) return '#f97316';
    return '#159205';
  };

  const findPinAt = (wx, wy) => {
    for (const comp of circuit.components) {
      const meta = COMPONENT_CATALOG[comp.kind];
      if(!meta) continue;
      for (const pin of meta.pins) {
        if (Math.hypot(getPinWorldPosition(comp, pin.index).x - wx, getPinWorldPosition(comp, pin.index).y - wy) <= 12) return { componentId: comp.id, pinIndex: pin.index };
      }
    }
    return null;
  };

  const findComponentAt = (wx, wy) => {
    for (let i = circuit.components.length - 1; i >= 0; i--) if (Math.hypot(circuit.components[i].x - wx, circuit.components[i].y - wy) <= 35) return circuit.components[i];
    return null;
  };

  const findWireAt = (wx, wy) => {
    const pt = { x: wx, y: wy };
    for (const wire of circuit.wires) {
      const cA = circuit.components.find(c => c.id === wire.from.componentId);
      const cB = circuit.components.find(c => c.id === wire.to.componentId);
      if (!cA || !cB) continue;
      const p1 = getPinWorldPosition(cA, wire.from.pinIndex);
      const p2 = getPinWorldPosition(cB, wire.to.pinIndex);
      const pMid = { x: p2.x, y: p1.y };
      if (distToSegmentSquared(pt, p1, pMid) <= 64 || distToSegmentSquared(pt, pMid, p2) <= 64) return wire;
    }
    return null;
  };

  const handleAddWire = (from, to) => {
    const exists = circuit.wires.some(w => (w.from.componentId === from.componentId && w.from.pinIndex === from.pinIndex && w.to.componentId === to.componentId && w.to.pinIndex === to.pinIndex) || (w.from.componentId === to.componentId && w.from.pinIndex === to.pinIndex && w.to.componentId === from.componentId && w.to.pinIndex === from.pinIndex));
    if (exists) return onShowToast('Провід вже зʼєднано');

    const compA = circuit.components.find(c => c.id === from.componentId);
    const compB = circuit.components.find(c => c.id === to.componentId);
    const pinA = COMPONENT_CATALOG[compA.kind].pins.find(p => p.index === from.pinIndex);
    const pinB = COMPONENT_CATALOG[compB.kind].pins.find(p => p.index === to.pinIndex);

    const isPlusA = pinA?.label?.includes('+'); const isMinusA = pinA?.label?.includes('-');
    const isPlusB = pinB?.label?.includes('+'); const isMinusB = pinB?.label?.includes('-');

    if ((isPlusA && isMinusB) || (isMinusA && isPlusB)) {
      if (compA.id === compB.id && compA.kind === 'battery') return onShowToast('Помилка: Пряме замикання батареї заборонено!', 'error');
      onShowToast('Увага: ви зʼєднали плюс із мінусом', 'warning');
    } else {
      onShowToast('Зʼєднання створено', 'success');
    }

    const wire = { id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, from, to };
    setCircuit(prev => ({ ...prev, wires: [...prev.wires, wire] }));
    setSelectedWireId(wire.id); setSelectedComponentId(null); 
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.parentElement.clientWidth, h = canvas.parentElement.clientHeight, dpr = window.devicePixelRatio || 1;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = `${w}px`; canvas.style.height = `${h}px`; }

    let animationFrameId;

    const render = (time) => {
      ctx.save(); ctx.scale(dpr, dpr); ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.translate(transform.offsetX, transform.offsetY); ctx.scale(transform.scale, transform.scale);

      if (transform.scale >= 0.5) {
        ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
        for (let x = Math.floor(-transform.offsetX / transform.scale / GRID_SIZE) * GRID_SIZE - GRID_SIZE; x <= Math.ceil((w - transform.offsetX) / transform.scale / GRID_SIZE) * GRID_SIZE + GRID_SIZE; x += GRID_SIZE) {
          for (let y = Math.floor(-transform.offsetY / transform.scale / GRID_SIZE) * GRID_SIZE - GRID_SIZE; y <= Math.ceil((h - transform.offsetY) / transform.scale / GRID_SIZE) * GRID_SIZE + GRID_SIZE; y += GRID_SIZE) {
            ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
          }
        }
      }

      const activeResult = runSimulation(circuit, time / 1000);

      for (const wire of circuit.wires) {
        const cA = circuit.components.find(c => c.id === wire.from.componentId), cB = circuit.components.find(c => c.id === wire.to.componentId);
        if (!cA || !cB) continue;
        const p1 = getPinWorldPosition(cA, wire.from.pinIndex), p2 = getPinWorldPosition(cB, wire.to.pinIndex), pot = activeResult.pinVoltages[pinKey(wire.from.componentId, wire.from.pinIndex)];
        
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p1.y); ctx.lineTo(p2.x, p2.y);
        ctx.lineWidth = wire.id === selectedWireId ? 5 : 2.5; 
        ctx.strokeStyle = wire.id === selectedWireId ? '#f59e0b' : (activeResult.success ? getVoltageColor(pot) : '#475569'); 
        ctx.stroke();

        if (activeResult.success) {
          const potA = activeResult.pinVoltages[pinKey(wire.from.componentId, wire.from.pinIndex)] || 0;
          const potB = activeResult.pinVoltages[pinKey(wire.to.componentId, wire.to.pinIndex)] || 0;
          const wireSim = activeResult.wires?.[wire.id];
          const currentVal = wireSim ? Math.abs(wireSim.current) : 0;

          if (Math.abs(potA) > 1 || Math.abs(potB) > 1 || currentVal > 1e-5) {
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p1.y); ctx.lineTo(p2.x, p2.y);
            ctx.lineWidth = 2.5; ctx.strokeStyle = '#fde047'; ctx.setLineDash([4, 10]);
            const speed = 4;
            ctx.lineDashOffset = (time / 30 * speed) % 14;
            ctx.stroke(); ctx.setLineDash([]);
          }
        }
      }

      if (wireStartPin) {
        const sComp = circuit.components.find(c => c.id === wireStartPin.componentId);
        if (sComp) {
          const p1 = getPinWorldPosition(sComp, wireStartPin.pinIndex);
          ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(mouseWorldPos.x, p1.y); ctx.lineTo(mouseWorldPos.x, mouseWorldPos.y);
          ctx.lineWidth = 2.5; ctx.strokeStyle = '#38bdf8'; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
        }
      }

      for (const comp of circuit.components) {
        const sim = activeResult.components[comp.id];
        ctx.save(); ctx.translate(comp.x, comp.y); ctx.rotate((comp.rotation * Math.PI) / 180);

        if (comp.id === selectedComponentId) {
          ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
          ctx.beginPath(); ctx.roundRect(-42, -28, 84, 56, 8); ctx.fill(); ctx.stroke();
        }

        ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

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
        } else if (comp.kind === 'relay') {
          ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.rect(-24, -14, 12, 28); ctx.stroke(); 
          ctx.beginPath(); ctx.moveTo(-20, -20); ctx.lineTo(-20, -14); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-20, 14); ctx.lineTo(-20, 20); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(20, -20); ctx.lineTo(20, -10); ctx.stroke(); ctx.beginPath(); ctx.moveTo(20, 20); ctx.lineTo(20, 10); ctx.stroke();
          ctx.beginPath(); ctx.arc(20, -10, 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(20, 10, 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.beginPath();
          if (sim?.isLit) { ctx.moveTo(20, -8); ctx.lineTo(20, 8); ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3; } else { ctx.moveTo(20, -8); ctx.lineTo(10, 5); }
          ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(15, 0); ctx.setLineDash([3, 3]); ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
        } else if (comp.kind === 'npn') {
          ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-10, 0); ctx.stroke(); 
          ctx.beginPath(); ctx.moveTo(-10, -15); ctx.lineTo(-10, 15); ctx.lineWidth = 3; ctx.stroke(); 
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-10, -5); ctx.lineTo(20, -20); ctx.stroke(); 
          ctx.beginPath(); ctx.moveTo(-10, 5); ctx.lineTo(20, 20); ctx.stroke(); 
          ctx.beginPath(); ctx.moveTo(20, 20); ctx.lineTo(12, 20); ctx.lineTo(16, 13); ctx.closePath(); ctx.fillStyle = '#e2e8f0'; ctx.fill();
          ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5; ctx.stroke(); 
        } else if (comp.kind === 'jk_ff') {
          ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.rect(-20, -30, 40, 60); ctx.stroke(); 
          
          ctx.beginPath(); ctx.moveTo(-30, -20); ctx.lineTo(-20, -20); ctx.stroke(); 
          ctx.fillStyle = '#64748b'; ctx.font = '10px monospace'; ctx.fillText('J', -12, -17);
          
          ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-20, 0); ctx.stroke(); 
          ctx.beginPath(); ctx.moveTo(-20, -4); ctx.lineTo(-14, 0); ctx.lineTo(-20, 4); ctx.stroke(); 
          
          ctx.beginPath(); ctx.moveTo(-30, 20); ctx.lineTo(-20, 20); ctx.stroke(); 
          ctx.fillText('K', -12, 23);
          
          ctx.beginPath(); ctx.moveTo(20, -20); ctx.lineTo(30, -20); ctx.stroke(); 
          ctx.fillText('Q', 12, -17);
          
          ctx.beginPath(); ctx.moveTo(20, 20); ctx.lineTo(30, 20); ctx.stroke(); 
          ctx.beginPath(); ctx.arc(23, 20, 3, 0, Math.PI*2); ctx.stroke(); 
          ctx.fillText('Q', 10, 23);
        } else if (comp.kind === 'adder') {
          ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.rect(-20, -30, 40, 60); ctx.stroke(); 
          
          ctx.beginPath(); ctx.moveTo(-30, -20); ctx.lineTo(-20, -20); ctx.stroke(); // A
          ctx.fillStyle = '#64748b'; ctx.font = '10px monospace'; ctx.fillText('A', -12, -17);
          
          ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-20, 0); ctx.stroke(); // B
          ctx.fillText('B', -12, 3);
          
          ctx.beginPath(); ctx.moveTo(-30, 20); ctx.lineTo(-20, 20); ctx.stroke(); // Cin
          ctx.font = '9px monospace'; ctx.fillText('Cin', -8, 23);
          
          ctx.beginPath(); ctx.moveTo(20, -10); ctx.lineTo(30, -10); ctx.stroke(); // S
          ctx.font = '10px monospace'; ctx.fillText('S', 12, -7);
          
          ctx.beginPath(); ctx.moveTo(20, 10); ctx.lineTo(30, 10); ctx.stroke(); // Cout
          ctx.fillText('C', 12, 13);
        } else if (comp.kind === 'ground') {
          ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, 0); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.moveTo(-10, 6); ctx.lineTo(10, 6); ctx.moveTo(-4, 12); ctx.lineTo(4, 12); ctx.stroke();
        } else if (comp.kind === 'node') {
          ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        } else if (comp.kind === 'and') {
          ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
          const inCount = comp.inputsCount || 2;
          for (let i = 0; i < inCount; i++) {
            const yPos = -15 + (30 / (inCount - 1 || 1)) * i;
            ctx.beginPath(); ctx.moveTo(-30, yPos); ctx.lineTo(-20, yPos); ctx.stroke();
          }
          ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(30, 0); ctx.stroke(); 
          ctx.beginPath(); ctx.moveTo(-20, -16); ctx.lineTo(-20, 16); ctx.lineTo(0, 16); 
          ctx.arc(0, 0, 16, Math.PI/2, -Math.PI/2, true); ctx.lineTo(-20, -16); ctx.stroke();
          ctx.fillStyle = '#64748b'; ctx.font = 'bold 12px monospace'; ctx.fillText('&', -8, 4);
        } else if (comp.kind === 'or' || comp.kind === 'nor') {
          ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
          const inCount = comp.inputsCount || 2;
          for (let i = 0; i < inCount; i++) {
            const yPos = -15 + (30 / (inCount - 1 || 1)) * i;
            ctx.beginPath(); ctx.moveTo(-30, yPos); ctx.lineTo(-14, yPos); ctx.stroke();
          }
          ctx.beginPath(); ctx.moveTo(comp.kind === 'nor' ? 24 : 20, 0); ctx.lineTo(30, 0); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-20, -16); ctx.quadraticCurveTo(-10, 0, -20, 16); 
          ctx.quadraticCurveTo(10, 16, 20, 0); ctx.quadraticCurveTo(10, -16, -20, -16); ctx.stroke();
          ctx.fillStyle = '#64748b'; ctx.font = 'bold 12px monospace'; ctx.fillText('1', -5, 4);
          if (comp.kind === 'nor') { ctx.beginPath(); ctx.arc(22, 0, 3, 0, Math.PI*2); ctx.stroke(); }
        } else if (comp.kind === 'not') {
          ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-14, 0); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(30, 0); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(12, 0); ctx.lineTo(-14, 14); ctx.closePath(); ctx.stroke();
          ctx.beginPath(); ctx.arc(15, 0, 3, 0, Math.PI*2); ctx.stroke();
          ctx.fillStyle = '#64748b'; ctx.font = 'bold 12px monospace'; ctx.fillText('1', -5, 4);
        } else if (comp.kind === 'voltmeter' || comp.kind === 'ammeter') {
          ctx.strokeStyle = '#e2e8f0'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-18, 0); ctx.moveTo(18, 0); ctx.lineTo(30, 0); ctx.stroke();
          ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(comp.kind === 'voltmeter' ? 'V' : 'A', 0, 1);
        }
        ctx.restore();

        if (comp.kind !== 'node') {
          ctx.save(); ctx.translate(comp.x, comp.y); ctx.font = '12px Archivo, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#94a3b8'; ctx.fillText(comp.label, 0, -28);
          
          if (comp.kind === 'switch' && comp.hotkey) {
            ctx.font = 'bold 10px monospace'; ctx.fillStyle = '#f59e0b'; ctx.fillText(`[${comp.hotkey}]`, 0, 15);
          }
          if (activeResult.success && sim) {
            ctx.font = '11px monospace';
            if (comp.kind === 'voltmeter') { ctx.fillStyle = '#38bdf8'; ctx.fillText(formatVoltage(sim.voltage), 0, 32); } 
            else if (comp.kind === 'ammeter') { ctx.fillStyle = '#34d399'; ctx.fillText(formatCurrent(sim.current), 0, 32); } 
            else if ((comp.kind === 'relay' || comp.kind === 'npn') && sim.isLit) { ctx.fillStyle = '#34d399'; ctx.fillText(`Відкрито`, 0, 32); }
          }
          ctx.restore();
        }
      }

      for (const comp of circuit.components) {
        const meta = COMPONENT_CATALOG[comp.kind];
        if(!meta) continue;
        for (const pin of meta.pins) {
          const pos = getPinWorldPosition(comp, pin.index), isHov = hoveredPin?.componentId === comp.id && hoveredPin?.pinIndex === pin.index, isStart = wireStartPin?.componentId === comp.id && wireStartPin?.pinIndex === pin.index;
          ctx.beginPath(); ctx.arc(pos.x, pos.y, isHov || isStart ? 6 : 4, 0, Math.PI * 2);
          ctx.fillStyle = isStart ? '#38bdf8' : isHov ? '#f59e0b' : '#64748b'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.fill(); ctx.stroke();
        }
      }

      const drawTutorialHint = (p1, p2, timeOffset = 0) => {
        const tTime = time + timeOffset;
        const pulse = (Math.sin(tTime / 150) + 1) * 3;
        ctx.beginPath(); ctx.arc(p1.x, p1.y, 8 + pulse, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(p2.x, p2.y, 8 + pulse, 0, Math.PI*2); ctx.stroke();

        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'; ctx.lineWidth = 4;
        ctx.setLineDash([8, 8]); ctx.lineDashOffset = -(tTime / 20); ctx.stroke(); ctx.setLineDash([]);

        let t = (tTime % 2000) / 2000;
        let animT = t < 0.2 ? 0 : t > 0.8 ? 1 : (t - 0.2) / 0.6; 
        animT = animT * animT * (3 - 2 * animT); 
        
        const cx = p1.x + (p2.x - p1.x) * animT;
        const cy = p1.y + (p2.y - p1.y) * animT;
        
        ctx.beginPath(); 
        ctx.moveTo(cx, cy); ctx.lineTo(cx + 14, cy + 14); ctx.lineTo(cx + 5, cy + 17); ctx.lineTo(cx, cy + 24); 
        ctx.closePath();
        ctx.fillStyle = '#ffffff'; ctx.fill(); 
        ctx.strokeStyle = '#000000'; ctx.lineWidth = 1; ctx.stroke();
      };

      if (tutorialStep === 3) {
        const bat = circuit.components.find(c => c.kind === 'battery');
        const res = circuit.components.find(c => c.kind === 'resistor');
        if (bat && res) drawTutorialHint(getPinWorldPosition(bat, 0), getPinWorldPosition(res, 0));
      } else if (tutorialStep === 5) {
        const res = circuit.components.find(c => c.kind === 'resistor');
        const led = circuit.components.find(c => c.kind === 'led');
        if (res && led) drawTutorialHint(getPinWorldPosition(res, 1), getPinWorldPosition(led, 0));
      } else if (tutorialStep === 7) {
        const bat = circuit.components.find(c => c.kind === 'battery');
        const led = circuit.components.find(c => c.kind === 'led');
        const gnd = circuit.components.find(c => c.kind === 'ground');
        if (bat && gnd && led) {
          drawTutorialHint(getPinWorldPosition(bat, 1), getPinWorldPosition(gnd, 0));
          drawTutorialHint(getPinWorldPosition(led, 1), getPinWorldPosition(gnd, 0), 1000);
        }
      }

      ctx.restore(); ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [circuit, solveResult, transform, selectedComponentId, selectedWireId, hoveredPin, wireStartPin, mouseWorldPos, tutorialStep]);

  const onMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect(), mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top, worldPos = screenToWorld(mouseX, mouseY);
    
    const pin = findPinAt(worldPos.x, worldPos.y);
    if (pin) { 
      if (!wireStartPin) { setWireStartPin(pin); return; } 
      else { 
        if (wireStartPin.componentId !== pin.componentId || wireStartPin.pinIndex !== pin.pinIndex) handleAddWire(wireStartPin, pin); 
        setWireStartPin(null); return; 
      } 
    }
    if (wireStartPin) { setWireStartPin(null); return; }

    const comp = findComponentAt(worldPos.x, worldPos.y);
    if (comp) {
      setSelectedComponentId(comp.id); setSelectedWireId(null); setDraggingCompId(comp.id); setDragOffset({ x: worldPos.x - comp.x, y: worldPos.y - comp.y }); return;
    }

    const wire = findWireAt(worldPos.x, worldPos.y);
    if (wire) {
      setSelectedWireId(wire.id); setSelectedComponentId(null); return;
    }

    setSelectedComponentId(null); setSelectedWireId(null); setIsPanning(true); setPanStart({ x: mouseX - transform.offsetX, y: mouseY - transform.offsetY });
  };
  
  const onMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect(), mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top, worldPos = screenToWorld(mouseX, mouseY);
    setMouseWorldPos(worldPos); setHoveredPin(findPinAt(worldPos.x, worldPos.y));
    if (isPanning) { setTransform(prev => ({ ...prev, offsetX: mouseX - panStart.x, offsetY: mouseY - panStart.y })); return; }
    if (draggingCompId) setCircuit(prev => ({ ...prev, components: prev.components.map(c => c.id === draggingCompId ? { ...c, x: Math.round((worldPos.x - dragOffset.x) / GRID_SIZE) * GRID_SIZE, y: Math.round((worldPos.y - dragOffset.y) / GRID_SIZE) * GRID_SIZE } : c) }));
  };
  
  const onMouseUp = () => { setIsPanning(false); setDraggingCompId(null); };
  
  const onWheel = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect(), mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top, zoom = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform(prev => { const newScale = Math.min(2.5, Math.max(0.4, prev.scale * zoom)); return { scale: newScale, offsetX: mouseX - (mouseX - prev.offsetX) * (newScale / prev.scale), offsetY: mouseY - (mouseY - prev.offsetY) * (newScale / prev.scale) }; });
  };
  
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponentId) setCircuit(prev => ({ components: prev.components.filter(c => c.id !== selectedComponentId), wires: prev.wires.filter(w => w.from.componentId !== selectedComponentId && w.to.componentId !== selectedComponentId) }));
        else if (selectedWireId) setCircuit(prev => ({ ...prev, wires: prev.wires.filter(w => w.id !== selectedWireId) }));
      } else if (e.key === 'r' || e.key === 'R') {
        if (selectedComponentId) setCircuit(prev => ({ ...prev, components: prev.components.map(c => c.id === selectedComponentId ? { ...c, rotation: (c.rotation + 90) % 360 } : c) }));
      } else if (e.key.length === 1) {
        const keyPress = e.key.toUpperCase();
        setCircuit(prev => {
          let hasChanges = false;
          const newComps = prev.components.map(c => {
            if (c.kind === 'switch' && c.hotkey === keyPress) { hasChanges = true; return { ...c, value: c.value === 1 ? 0 : 1 }; }
            return c;
          });
          return hasChanges ? { ...prev, components: newComps } : prev;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedComponentId, selectedWireId]);

  return (
    <>
      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair block" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onWheel={onWheel} />
    </>
  );
}