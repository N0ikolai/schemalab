import { useState } from 'react';
import { CircuitProvider } from './context/CircuitContext.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { CircuitCanvas } from './components/CircuitCanvas.jsx';
import { Header } from './components/Header.jsx';
import { PropertiesPanel } from './components/PropertiesPanel.jsx';
import { Tutorial } from './components/Tutorial.jsx';

export default function App() {
  const [toast, setToast] = useState(null);
  const [tutorialStep, setTutorialStep] = useState(0);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <CircuitProvider>
      <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
        <Header onShowToast={showToast} onStartTutorial={() => setTutorialStep(1)} />
        
        <div className="flex flex-1 overflow-hidden relative">
          
          {/* ЛІВА ПАНЕЛЬ */}
          <div className={`transition-[width] duration-300 ease-in-out relative z-20 shrink-0 h-full ${leftOpen ? 'w-72' : 'w-0'}`}>
            {/* Панель, що виїжджає за екран, не сплющуючись */}
            <div className={`absolute top-0 left-0 h-full w-72 flex flex-col border-r border-slate-800 bg-slate-950 shadow-xl transition-transform duration-300 ease-in-out ${leftOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <Sidebar onShowToast={showToast} tutorialStep={tutorialStep} />
            </div>
            
            {/* Кнопка згортання (ліва) */}
            <button 
              onClick={() => setLeftOpen(!leftOpen)}
              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-16 bg-slate-800 border border-slate-700 rounded-r-lg text-slate-400 hover:text-white hover:bg-slate-700 shadow-lg transition-all duration-300 ease-in-out z-30"
              style={{ left: leftOpen ? '18rem' : '0' }}
              title={leftOpen ? "Сховати палітру" : "Показати палітру"}
            >
              <span className="text-[10px]">{leftOpen ? '◀' : '▶'}</span>
            </button>
          </div>

          {/* ГОЛОВНИЙ ХОЛСТ */}
          <main className="flex-1 relative min-w-0 z-0 h-full">
            <CircuitCanvas onShowToast={showToast} tutorialStep={tutorialStep} />
            
            {tutorialStep > 0 && (
              <Tutorial 
                step={tutorialStep} 
                setStep={setTutorialStep} 
                onClose={() => setTutorialStep(0)} 
              />
            )}

            {toast && (
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded shadow-lg text-sm z-50 transition-all ${
                toast.type === 'error' ? 'bg-rose-600 text-white' :
                toast.type === 'warning' ? 'bg-amber-500 text-slate-900' :
                toast.type === 'success' ? 'bg-emerald-500 text-white' :
                'bg-slate-800 text-slate-200 border border-slate-700'
              }`}>
                {toast.message}
              </div>
            )}
          </main>

          {/* ПРАВА ПАНЕЛЬ */}
          <div className={`transition-[width] duration-300 ease-in-out relative z-20 shrink-0 h-full ${rightOpen ? 'w-72' : 'w-0'}`}>
            {/* Кнопка згортання (права) */}
            <button 
              onClick={() => setRightOpen(!rightOpen)}
              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-16 bg-slate-800 border border-slate-700 rounded-l-lg text-slate-400 hover:text-white hover:bg-slate-700 shadow-lg transition-all duration-300 ease-in-out z-30"
              style={{ right: rightOpen ? '18rem' : '0' }}
              title={rightOpen ? "Сховати властивості" : "Показати властивості"}
            >
              <span className="text-[10px]">{rightOpen ? '▶' : '◀'}</span>
            </button>

            <div className={`absolute top-0 right-0 h-full w-72 flex flex-col border-l border-slate-800 bg-slate-950 shadow-xl transition-transform duration-300 ease-in-out ${rightOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <PropertiesPanel onShowToast={showToast} />
            </div>
          </div>

        </div>
      </div>
    </CircuitProvider>
  );
}