import { useState } from 'react';
import { CircuitProvider } from './context/CircuitContext.jsx';
import { Header } from './components/Header.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { CircuitCanvas } from './components/CircuitCanvas.jsx';

export default function App() {
  const [toast, setToast] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <CircuitProvider>
      <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 select-none overflow-hidden">
        <Header onShowHelp={() => setIsHelpOpen(true)} onShowToast={showToast} />
        
        <div className="flex-1 flex relative overflow-hidden">
          <main className="flex-1 relative h-full">
            <CircuitCanvas onShowToast={showToast} />
          </main>
          <Sidebar onShowToast={showToast} />
        </div>

        {/* Довідка модальне вікно */}
        {isHelpOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 text-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-slate-100">📘 Довідка симулятора СхемаЛаб</h3>
                <button onClick={() => setIsHelpOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="text-xs space-y-3 leading-relaxed text-slate-300">
                <p><strong>СхемаЛаб</strong> — клієнтський браузерний симулятор електронних схем постійного струму.</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong>Додавання:</strong> клікніть по елементу на лівій панелі.</li>
                  <li><strong>З'єднання:</strong> протягніть лінію від одного піна до іншого.</li>
                  <li><strong>Опорний вузол (GND):</strong> для початку розрахунку обов'язково встановіть «Землю» (GND).</li>
                  <li><strong>Гарячі клавіші:</strong> <kbd className="px-1 bg-slate-800 rounded text-sky-400">R</kbd> — обертання, <kbd className="px-1 bg-slate-800 rounded text-rose-400">Delete</kbd> — видалення.</li>
                </ul>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button onClick={() => setIsHelpOpen(false)} className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold">
                  Зрозуміло
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Всплывающие уведомления (Toasts) */}
        {toast && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white z-50 shadow-xl">
            {toast.msg}
          </div>
        )}
      </div>
    </CircuitProvider>
  );
}