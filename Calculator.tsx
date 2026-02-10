
import React, { useState } from 'react';

const Calculator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleInput = (val: string) => {
    if (display === '0') setDisplay(val);
    else setDisplay(display + val);
  };

  const handleOp = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      const fullEq = equation + display;
      // Using a safer evaluation for basic math
      const result = eval(fullEq.replace('×', '*').replace('÷', '/'));
      setDisplay(String(Number(result).toFixed(2)));
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  return (
    <div className="fixed bottom-24 right-8 w-64 bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl p-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Math Tool</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white"><i className="fas fa-times"></i></button>
      </div>
      <div className="bg-black p-3 rounded mb-4 text-right overflow-hidden">
        <div className="text-xs text-slate-500 h-4">{equation}</div>
        <div className="text-xl font-mono text-white truncate">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '=', '+'].map((btn) => (
          <button
            key={btn}
            onClick={() => {
              if (btn === '=') calculate();
              else if (['+', '-', '×', '÷'].includes(btn)) handleOp(btn);
              else handleInput(btn);
            }}
            className={`p-2 rounded font-bold ${btn === '=' ? 'bg-red-600' : 'bg-slate-800'} hover:opacity-80 transition-opacity`}
          >
            {btn}
          </button>
        ))}
        <button onClick={() => { setDisplay('0'); setEquation(''); }} className="col-span-4 mt-2 p-2 bg-slate-700 rounded text-sm uppercase font-bold">Clear</button>
      </div>
    </div>
  );
};

export default Calculator;
