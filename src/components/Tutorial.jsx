import { useEffect, useContext } from 'react';
import { CircuitContext } from '../context/CircuitContext.jsx';

export function Tutorial({ step, setStep, onClose }) {
  const { circuit, solveResult } = useContext(CircuitContext);

  useEffect(() => {
    const bat = circuit.components.find(c => c.kind === 'battery');
    const res = circuit.components.find(c => c.kind === 'resistor');
    const led = circuit.components.find(c => c.kind === 'led');
    const gnd = circuit.components.find(c => c.kind === 'ground');

    const checkWire = (c1, c2) => {
      if (!c1 || !c2) return false;
      return circuit.wires.some(w => 
        (w.from.componentId === c1.id && w.to.componentId === c2.id) || 
        (w.from.componentId === c2.id && w.to.componentId === c1.id)
      );
    };

    const batResWired = checkWire(bat, res);
    const resLedWired = checkWire(res, led);
    
    let isLit = false;
    if (solveResult && solveResult.success && led && solveResult.components[led.id]?.isLit) {
      isLit = true;
    }

    if (step === 1 && bat) setStep(2);
    if (step === 2 && res) setStep(3);
    if (step === 3 && batResWired) setStep(4);
    if (step === 4 && led) setStep(5);
    if (step === 5 && resLedWired) setStep(6);
    if (step === 6 && gnd) setStep(7);
    if (step === 7 && isLit) setStep(8);
  }, [circuit, solveResult, step, setStep]);

  const stepsText = {
    1: "Крок 1: Зберемо першу схему! Натисни на «Джерело DC» (Батарею) зліва в меню, щоб додати її на поле.",
    2: "Крок 2: Відмінно. Тепер додай «Резистор». Він потрібен, щоб наш діод не згорів від напруги.",
    3: "Крок 3: З'єднаємо їх! У батареї червона лінія — це Плюс (+), а синя — Мінус (-). Протягни провід від Плюса батареї до контакту резистора.",
    4: "Крок 4: Чудово. Тепер додай «Світлодіод» (він знаходиться в категорії «Логіка»).",
    5: "Крок 5: Протягни провід від другого контакту резистора до Плюса (А) світлодіода.",
    6: "Крок 6: Залишилася «Земля (GND)». Без неї симулятор не зрозуміє, куди текти струму.",
    7: "Крок 7: Замкни ланцюг! Протягни проводи від Мінуса (синя лінія) батареї та Мінуса (К) діода до Землі.",
    8: "Вітаємо! Діод засвітився, струм пішов! Тепер ти розумієш логіку створення схем. 🎉"
  };

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-sky-500/50 p-5 rounded-xl shadow-2xl shadow-sky-900/20 z-50 w-[480px] backdrop-blur-md">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sky-400 font-bold text-sm flex items-center space-x-2">
          <span>🎓</span> <span>Навчання: Перша схема</span>
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
      </div>
      
      <div className="text-sm text-slate-200 mb-4 min-h-[60px] font-medium leading-relaxed whitespace-pre-line">
        {stepsText[step]}
      </div>
      
      {!solveResult?.success && circuit.components.length > 0 && step === 7 && (
        <div className="mb-4 p-2 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs font-bold animate-pulse">
          ⚠️ Помилка: {solveResult?.errorMessageUk || "Перевірте правильність з'єднань"}
        </div>
      )}
      
      <div className="flex space-x-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div 
            key={i} 
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < step ? 'bg-emerald-500' : 
              i === step ? 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]' : 
              'bg-slate-700'
            }`} 
          />
        ))}
      </div>

      {step === 8 && (
        <button onClick={onClose} className="mt-5 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs transition-colors tracking-wide">
          ЗАВЕРШИТИ НАВЧАННЯ
        </button>
      )}
    </div>
  );
}