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

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <CircuitProvider>
      <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
        <Header onShowToast={showToast} onStartTutorial={() => setTutorialStep(1)} />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar onShowToast={showToast} tutorialStep={tutorialStep} />
          
          <main className="flex-1 relative">
            <CircuitCanvas onShowToast={showToast} />
            
            {tutorialStep > 0 && (
              <Tutorial 
                step={tutorialStep} 
                setStep={setTutorialStep} 
                onClose={() => setTutorialStep(0)} 
              />
            )}

            {toast && (
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded shadow-lg text-sm z-50 ${
                toast.type === 'error' ? 'bg-rose-600 text-white' :
                toast.type === 'warning' ? 'bg-amber-500 text-slate-900' :
                toast.type === 'success' ? 'bg-emerald-500 text-white' :
                'bg-slate-800 text-slate-200 border border-slate-700'
              }`}>
                {toast.message}
              </div>
            )}
          </main>

          <PropertiesPanel onShowToast={showToast} />
        </div>
      </div>
    </CircuitProvider>
  );
}