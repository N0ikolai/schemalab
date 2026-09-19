import { useEffect, useContext } from 'react';
import { CircuitContext } from '../context/CircuitContext.jsx';

export function Tutorial({ step, setStep, onClose }) {
  const { circuit, solveResult } = useContext(CircuitContext);

  useEffect(() => {
    const hasBattery = circuit.components.some(c => c.kind === 'battery');
    const hasResistor = circuit.components.some(c => c.kind === 'resistor');
    const hasLed = circuit.components.some(c => c.kind === 'led');
    const hasGround = circuit.components.some(c => c.kind === 'ground');
    
    let isLit = false;
    if (solveResult && solveResult.success) {
      const led = circuit.components.find(c => c.kind === 'led');
      if (led && solveResult.components[led.id] && solveResult.components[led.id].isLit) {
        isLit = true;
      }
    }

    if (step === 1 && hasBattery) setStep(2);
    if (step === 2 && hasResistor) setStep(3);
    if (step === 3 && hasLed) setStep(4);
    if (step === 4 && hasGround) setStep(5);
    if (step === 5 && isLit) setStep(6);
  }, [circuit, solveResult, step, setStep]);

  const stepsText = {
    1: "Крок 1: Давай зберемо схему! Зліва в меню знайди і натисни на Джерело DC (Батарея). Кнопка підсвічується!",
    2: "Крок 2: Відмінно. Тепер додай Резистор. Він потрібен, щоб наш діод не згорів від напруги.",
    3: "Крок 3: Тепер додай Світлодіод. Він знаходиться в категорії «Логіка».",
    4: "Крок 4: Залишилася Земля (GND). Це найважливіший елемент. Без неї симулятор не зможе рахувати струм.",
    5: "Крок 5: Час з'єднати деталі!\n👉 Натисни на кружечок плюса батареї, а потім на контакт резистора.\n👉 З'єднай все ланцюгом: Батарея(+) → Резистор → Діод(А).\n👉 Всі мінуси (вільні контакти) з'єднай із Землею.",
    6: "Вітаємо! Діод засвітився, струм пішов! Ти навчився збирати схеми. 🎉"
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
      
      {!solveResult?.success && circuit.components.length > 0 && step === 5 && (
        <div className="mb-4 p-2 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs font-bold animate-pulse">
          ⚠️ Помилка: {solveResult?.errorMessageUk || "Перевірте правильність з'єднань"}
        </div>
      )}
      
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
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

      {step === 6 && (
        <button onClick={onClose} className="mt-5 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs transition-colors tracking-wide">
          ЗАВЕРШИТИ НАВЧАННЯ
        </button>
      )}
    </div>
  );
}