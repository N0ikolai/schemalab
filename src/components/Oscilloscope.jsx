import { useEffect, useRef } from 'react';
import { solveCircuit } from '../engine/solveCircuit.js';

export function Oscilloscope({ circuit, selectedCompId }) {
  const canvasRef = useRef(null);
  const circuitRef = useRef(circuit);

  useEffect(() => {
    circuitRef.current = circuit;
  }, [circuit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    const history = new Array(150).fill(0);
    const startTime = performance.now();

    const render = () => {
      const t = (performance.now() - startTime) / 1000;
      const currentCircuit = circuitRef.current;

      const sim = solveCircuit(currentCircuit, t);
      let val = 0;
      
      if (sim.success && selectedCompId && sim.components[selectedCompId]) {
        val = sim.components[selectedCompId].voltage;
      }

      history.push(val);
      history.shift();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.height; i += 15) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }
      for (let i = 0; i < canvas.width; i += 15) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      
      const midY = canvas.height / 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(canvas.width, midY); ctx.stroke();

      const maxAbs = Math.max(5, ...history.map(Math.abs));
      const scale = (canvas.height / 2) / (maxAbs * 1.2);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = (i / (history.length - 1)) * canvas.width;
        const y = midY - (history[i] * scale);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [selectedCompId]);

  return (
    <div className="mt-4 bg-slate-950 rounded-lg p-2 border border-slate-800 shadow-inner">
      <div className="text-[10px] text-slate-400 mb-1 uppercase font-bold flex justify-between">
        <span>Осцилограф (Напруга)</span>
      </div>
      <canvas ref={canvasRef} width={260} height={100} className="w-full h-24 bg-slate-900 rounded border border-slate-700" />
    </div>
  );
}