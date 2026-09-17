import { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { CircuitContext } from '../context/CircuitContext.jsx';
import { COMPONENT_CATALOG, GRID_SIZE } from '../constants/componentCatalog.js';
import { getPinWorldPosition } from '../utils/geometry.js';
import { formatVoltage, formatCurrent } from '../utils/formatters.js';

function pinKey(cid, pidx) { return `${cid}:${pidx}`; }

export function CircuitCanvas({ onShowToast }) {
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

  const screenToWorld = useCallback((sx, sy) => ({
    x: (sx - transform.offsetX) / transform.scale,
    y: (sy - transform.offsetY) / transform.scale
  }), [transform]);

  const getVoltageColor = (v) => {
    if (v === undefined || isNaN(v)) return '#64748b';
    if (Math.abs(v) < 0.05) return '#06b6d4';
    if (v < 0) return '#3b82f6';
    if (v <= 2.5) return '#10b981';
    if (v <= 6) return '#eab308';
    if (v <= 12) return '#f97316';
    return '#ef4444';
  };

  const findPinAt = (wx, wy) => {
    for (const comp of circuit.components) {
      const meta = COMPONENT_CATALOG[comp.kind];
      for (const pin of meta.pins) {
        const pos = getPinWorldPosition(comp, pin.index);
        if (Math.hypot(pos.x - wx, pos.y - wy) <= 12) return { componentId: comp.id, pinIndex: pin.index };
      }
    }
    return null;
  };

  const findComponentAt = (wx, wy) => {
    for (let i = circuit.components.length - 1; i >= 0; i--) {
      const comp = circuit.components[i];
      if (Math.hypot(comp.x - wx, comp.y - wy) <= 35) return comp;
    }
    return null;
  };

  const findWireAt = (wx, wy) => {
    for (const w of circuit.wires) {
      const cA = circuit.components.find(c => c.id === w.from.componentId);
      const cB = circuit.components.find(c => c.id === w.to.componentId);
      if (!cA || !cB) continue;
      const p1 = getPinWorldPosition(cA, w.from.pinIndex);
      const p2 = getPinWorldPosition(cB, w.to.pinIndex);
      const midX = p2.x, midY = p1.y;
      const d1 = Math.min(Math.hypot(wx - p1.x, wy - p1.y), Math.hypot(wx - midX, wy - midY));
      const d2 = Math.min(Math.hypot(wx - midX, wy - midY), Math.hypot(wx - p2.x, wy - p2.y));
      if (d1 < 20 || d2 < 20) return w;
    }
    return null;
  };

  const handleAddWire = (from, to) => {
    const exists = circuit.wires.some(w =>
      (w.from.componentId === from.componentId && w.from.pinIndex === from.pinIndex && w.to.componentId === to.componentId && w.to.pinIndex === to.pinIndex) ||
      (w.from.componentId === to.componentId && w.from.pinIndex === to.pinIndex && w.to.componentId === from.componentId && w.to.pinIndex === from.pinIndex)
    );
    if (exists) return onShowToast('Провід вже зʼєднано');
    const wire = { id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, from, to };
    setCircuit(prev => ({ ...prev, wires: [...prev.wires, wire] }));
    setSelectedWireId(wire.id);
    setSelectedComponentId(null);
    onShowToast('Зʼєднання створено', 'success');
  };

  const handleDeleteComponent = (id) => {
    setCircuit(prev => ({
      components: prev.components.filter(c => c.id !== id),
      wires: prev.wires.filter(w => w.from.componentId !== id && w.to.componentId !== id)
    }));
    if (selectedComponentId === id) setSelectedComponentId(null);
  };

  const handleDeleteWire = (id) => {
    setCircuit(prev => ({ ...prev, wires: prev.wires.filter(w => w.id !== id) }));
    if (selectedWireId === id) setSelectedWireId(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(transform.offsetX, transform.offsetY);
    ctx.scale(transform.scale, transform.scale);

    // Сітка
    if (transform.scale >= 0.5) {
      const startX = Math.floor(-transform.offsetX / transform.scale / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
      const endX = Math.ceil((w - transform.offsetX) / transform.scale / GRID_SIZE) * GRID_SIZE + GRID_SIZE;
      const startY = Math.floor(-transform.offsetY / transform.scale / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
      const endY = Math.ceil((h - transform.offsetY) / transform.scale / GRID_SIZE) * GRID_SIZE + GRID_SIZE;

      ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
      for (let x = startX; x <= endX; x += GRID_SIZE) {
        for (let y = startY; y <= endY; y += GRID_SIZE) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Проводи
    for (const wire of circuit.wires) {
      const cA = circuit.components.find(c => c.id === wire.from.componentId);
      const cB = circuit.components.find(c => c.id === wire.to.componentId);
      if (!cA || !cB) continue;
      const p1 = getPinWorldPosition(cA, wire.from.pinIndex);
      const p2 = getPinWorldPosition(cB, wire.to.pinIndex);
      const isSel = wire.id === selectedWireId;
      const pot = solveResult.pinVoltages[pinKey(wire.from.componentId, wire.from.pinIndex)];

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineWidth = isSel ? 4 : 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = isSel ? '#f59e0b' : (solveResult.success ? getVoltageColor(pot) : '#475569');
      ctx.stroke();
    }

    // Тимчасовий провід
    if (wireStartPin) {
      const sComp = circuit.components.find(c => c.id === wireStartPin.componentId);
      if (sComp) {
        const p1 = getPinWorldPosition(sComp, wireStartPin.pinIndex);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(mouseWorldPos.x, p1.y);
        ctx.lineTo(mouseWorldPos.x, mouseWorldPos.y);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#38bdf8';
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Компоненти
    for (const comp of circuit.components) {
      const isSel = comp.id === selectedComponentId;
      const sim = solveResult.components[comp.id];

      ctx.save();
      ctx.translate(comp.x, comp.y);
      ctx.rotate((comp.rotation * Math.PI) / 180);

      if (isSel) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.beginPath();
        ctx.roundRect(-42, -28, 84, 56, 8);
        ctx.fill();
        ctx.stroke();
      }

      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (comp.kind === 'resistor') {
        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-18, 0); ctx.lineTo(-14, -10); ctx.lineTo(-8, 10); ctx.lineTo(-2, -10); ctx.lineTo(4, 10); ctx.lineTo(10, -10); ctx.lineTo(14, 10); ctx.lineTo(18, 0); ctx.lineTo(30, 0); ctx.stroke();
      } else if (comp.kind === 'battery') {
        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-8, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-8, -18); ctx.lineTo(-8, 18); ctx.lineWidth = 3; ctx.strokeStyle = '#38bdf8'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(8, 10); ctx.lineWidth = 5; ctx.strokeStyle = '#ef4444'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(30, 0); ctx.lineWidth = 2.2; ctx.strokeStyle = '#e2e8f0'; ctx.stroke();
        ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('+', -18, -12);
        ctx.fillStyle = '#ef4444'; ctx.fillText('−', 14, -12);
      } else if (comp.kind === 'ground') {
        ctx.strokeStyle = '#94a3b8';
        ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, 0); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.moveTo(-10, 6); ctx.lineTo(10, 6); ctx.moveTo(-4, 12); ctx.lineTo(4, 12); ctx.stroke();
      } else if (comp.kind === 'led') {
        const isLit = sim?.isLit;
        const glowColor = comp.ledColor === 'green' ? '#22c55e' : comp.ledColor === 'blue' ? '#3b82f6' : comp.ledColor === 'yellow' ? '#eab308' : '#ef4444';
        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-12, 0); ctx.moveTo(12, 0); ctx.lineTo(30, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-12, -14); ctx.lineTo(12, 0); ctx.lineTo(-12, 14); ctx.closePath();
        if (isLit) {
          ctx.fillStyle = glowColor; ctx.shadowColor = glowColor; ctx.shadowBlur = Math.min(25, 10 + (sim.current * 800)); ctx.fill();
        } else { ctx.fillStyle = '#1e293b'; ctx.fill(); ctx.stroke(); }
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.moveTo(12, -14); ctx.lineTo(12, 14); ctx.lineWidth = 2.5; ctx.strokeStyle = isLit ? glowColor : '#e2e8f0'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, -16); ctx.lineTo(12, -24); ctx.moveTo(12, -16); ctx.lineTo(20, -24); ctx.lineWidth = 1.5; ctx.strokeStyle = isLit ? glowColor : '#94a3b8'; ctx.stroke();
      } else if (comp.kind === 'voltmeter' || comp.kind === 'ammeter') {
        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-18, 0); ctx.moveTo(18, 0); ctx.lineTo(30, 0); ctx.stroke();
        ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = comp.kind === 'voltmeter' ? '#06b6d4' : '#10b981'; ctx.stroke();
        ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(comp.kind === 'voltmeter' ? 'V' : 'A', 0, 1);
      }
      ctx.restore();

      ctx.save();
      ctx.translate(comp.x, comp.y);
      ctx.font = '12px Archivo, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#94a3b8';
      ctx.fillText(comp.label, 0, -28);
      if (solveResult.success && sim) {
        ctx.font = '11px monospace';
        if (comp.kind === 'voltmeter') { ctx.fillStyle = '#38bdf8'; ctx.fillText(formatVoltage(sim.voltage), 0, 32); } 
        else if (comp.kind === 'ammeter') { ctx.fillStyle = '#34d399'; ctx.fillText(formatCurrent(sim.current), 0, 32); } 
        else if (comp.kind === 'led' && sim.isLit) { ctx.fillStyle = '#fde047'; ctx.fillText(`Світить (${formatCurrent(sim.current)})`, 0, 32); }
      }
      ctx.restore();
    }

    // Виводи (піни)
    for (const comp of circuit.components) {
      const meta = COMPONENT_CATALOG[comp.kind];
      for (const pin of meta.pins) {
        const pos = getPinWorldPosition(comp, pin.index);
        const isHov = hoveredPin?.componentId === comp.id && hoveredPin?.pinIndex === pin.index;
        const isStart = wireStartPin?.componentId === comp.id && wireStartPin?.pinIndex === pin.index;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, isHov || isStart ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isStart ? '#38bdf8' : isHov ? '#f59e0b' : '#64748b'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
        ctx.fill(); ctx.stroke();
      }
    }
    ctx.restore(); ctx.restore();
  }, [circuit, solveResult, transform, selectedComponentId, selectedWireId, hoveredPin, wireStartPin, mouseWorldPos]);

  const onMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
    const worldPos = screenToWorld(mouseX, mouseY);
    const pin = findPinAt(worldPos.x, worldPos.y);
    if (pin) {
      if (!wireStartPin) { setWireStartPin(pin); return; }
      else { if (wireStartPin.componentId !== pin.componentId || wireStartPin.pinIndex !== pin.pinIndex) handleAddWire(wireStartPin, pin); setWireStartPin(null); return; }
    }
    if (wireStartPin) { setWireStartPin(null); return; }

    const comp = findComponentAt(worldPos.x, worldPos.y);
    if (comp) {
      if (tool === 'delete') { handleDeleteComponent(comp.id); return; }
      setSelectedComponentId(comp.id); setSelectedWireId(null); setDraggingCompId(comp.id);
      setDragOffset({ x: worldPos.x - comp.x, y: worldPos.y - comp.y }); return;
    }

    const wire = findWireAt(worldPos.x, worldPos.y);
    if (wire) {
      if (tool === 'delete') { handleDeleteWire(wire.id); return; }
      setSelectedWireId(wire.id); setSelectedComponentId(null); return;
    }
    setSelectedComponentId(null); setSelectedWireId(null); setIsPanning(true);
    setPanStart({ x: mouseX - transform.offsetX, y: mouseY - transform.offsetY });
  };

  const onMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
    const worldPos = screenToWorld(mouseX, mouseY);
    setMouseWorldPos(worldPos);
    setHoveredPin(findPinAt(worldPos.x, worldPos.y));

    if (isPanning) { setTransform(prev => ({ ...prev, offsetX: mouseX - panStart.x, offsetY: mouseY - panStart.y })); return; }
    if (draggingCompId) {
      const snappedX = Math.round((worldPos.x - dragOffset.x) / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round((worldPos.y - dragOffset.y) / GRID_SIZE) * GRID_SIZE;
      setCircuit(prev => ({ ...prev, components: prev.components.map(c => c.id === draggingCompId ? { ...c, x: snappedX, y: snappedY } : c) }));
    }
  };

  const onMouseUp = () => { setIsPanning(false); setDraggingCompId(null); };

  const onWheel = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
    const zoom = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform(prev => {
      const newScale = Math.min(2.5, Math.max(0.4, prev.scale * zoom));
      return { scale: newScale, offsetX: mouseX - (mouseX - prev.offsetX) * (newScale / prev.scale), offsetY: mouseY - (mouseY - prev.offsetY) * (newScale / prev.scale) };
    });
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponentId) handleDeleteComponent(selectedComponentId);
        else if (selectedWireId) handleDeleteWire(selectedWireId);
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
        if (selectedComponentId) setCircuit(prev => ({ ...prev, components: prev.components.map(c => c.id === selectedComponentId ? { ...c, rotation: (c.rotation + 90) % 360 } : c) }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedComponentId, selectedWireId]);

  return (
    <>
      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair block" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onWheel={onWheel} />
      {!solveResult.success && solveResult.errorMessageUk && (
        <div className="absolute top-4 left-4 max-w-md bg-rose-950/90 backdrop-blur border border-rose-800 text-rose-200 px-4 py-3 rounded-lg shadow-xl z-20">
          <div className="font-bold text-xs uppercase tracking-wider text-rose-300 mb-1">⚠️ Потрібна дія</div>
          <div className="text-xs leading-relaxed">{solveResult.errorMessageUk}</div>
        </div>
      )}
      <div className="absolute bottom-3 right-4 bg-slate-900/80 backdrop-blur border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-400 font-mono pointer-events-none">
        {Math.round(transform.scale * 100)}% | Колесо: Зум | Перетягування: Панорама
      </div>
    </>
  );
}