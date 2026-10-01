import React from 'react';

export function AboutModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold text-white mb-4">Про програму</h2>
        <div className="text-slate-300 space-y-3">
          <p>
            Веб-симулятор електричних та логічних схем <strong>СхемаЛаб</strong>.
          </p>
          <div className="p-4 bg-slate-900 rounded border border-slate-700">
            <p className="text-sm leading-relaxed">
              Розроблено студентами групи ІСтаТ 2023-1<br />
              Михайленко М. І.<br />
              Дяченко Б. Г <br />
              ХНУМГ ім. О.М. Бекетова<br />
              під керівництвом Літвінова А. Л.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
          >
            Зрозуміло
          </button>
        </div>
      </div>
    </div>
  );
}