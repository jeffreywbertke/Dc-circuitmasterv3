
import React, { useState, useEffect, useCallback } from 'react';
import { CircuitType, CircuitData, Resistor, TargetParameter } from './types';
import CircuitSchematic from './components/CircuitSchematic';
import Calculator from './components/Calculator';
import { getCircuitExplanation } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CircuitType>(CircuitType.SERIES);
  const [circuit, setCircuit] = useState<CircuitData | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [showCalc, setShowCalc] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const generateProblem = useCallback(() => {
    // 1. Generate core values
    const v = Math.floor(Math.random() * 40) + 10; // 10V to 50V
    const rValues = [
      Math.floor(Math.random() * 40) + 10,
      Math.floor(Math.random() * 40) + 10,
      Math.floor(Math.random() * 40) + 10
    ];

    // 2. Calculate Resistance Equivalent (Req)
    let req = 0;
    if (activeTab === CircuitType.SERIES) {
      req = rValues.reduce((a, b) => a + b, 0);
    } else if (activeTab === CircuitType.PARALLEL) {
      req = 1 / (rValues.reduce((acc, r) => acc + (1 / r), 0));
    } else {
      // Combination: R1 + (R2 || R3)
      const rp = 1 / (1 / rValues[1] + 1 / rValues[2]);
      req = rValues[0] + rp;
    }

    // 3. Calculate Total Current (I = V / R)
    const itotal = v / req;

    // 4. Select Random Target
    const targets: TargetParameter[] = ['Req', 'Itotal', 'Vtotal'];
    const target = targets[Math.floor(Math.random() * targets.length)];

    let correctAnswer = 0;
    let unit = '';
    if (target === 'Req') {
      correctAnswer = Number(req.toFixed(2));
      unit = 'Ω';
    } else if (target === 'Itotal') {
      correctAnswer = Number(itotal.toFixed(2));
      unit = 'A';
    } else {
      correctAnswer = v;
      unit = 'V';
    }

    const newCircuit: CircuitData = {
      type: activeTab,
      sourceVoltage: v,
      resistors: rValues.map((val, i) => ({ id: `R${i + 1}`, value: val })),
      targetParameter: target,
      correctAnswer: correctAnswer,
      unit: unit,
      givenCurrent: Number(itotal.toFixed(3)) // Provide high precision current if solving for V
    };

    setCircuit(newCircuit);
    setUserAnswer('');
    setFeedback({ type: null, message: '' });
    setAiExplanation(null);
  }, [activeTab]);

  useEffect(() => {
    generateProblem();
  }, [generateProblem]);

  const handleCheckAnswer = () => {
    if (!circuit) return;
    const userVal = parseFloat(userAnswer);
    if (isNaN(userVal)) {
      setFeedback({ type: 'error', message: 'Please enter a numeric value.' });
      return;
    }

    const tolerance = circuit.targetParameter === 'Req' ? 0.5 : 0.1;
    if (Math.abs(userVal - circuit.correctAnswer) <= tolerance) {
      setFeedback({ type: 'success', message: `Correct! The ${circuit.targetParameter} is ${circuit.correctAnswer}${circuit.unit}.` });
    } else {
      setFeedback({ type: 'error', message: `Not quite. Expected around ${circuit.correctAnswer}${circuit.unit}. Check your steps!` });
    }
  };

  const handleAskAi = async () => {
    if (!circuit) return;
    setIsAiLoading(true);
    const explanation = await getCircuitExplanation(circuit);
    setAiExplanation(explanation);
    setIsAiLoading(false);
  };

  const getProblemText = () => {
    if (!circuit) return '';
    switch (circuit.targetParameter) {
      case 'Req': return 'Find the Total Equivalent Resistance (Req) of the entire circuit.';
      case 'Itotal': return 'Given the source voltage, find the Total Current (Itotal) flowing from the source.';
      case 'Vtotal': return `Find the Source Voltage (Vtotal) required to produce a total current of ${circuit.givenCurrent}A in this circuit.`;
      default: return '';
    }
  };

  // Helper to render basic text with bold support (minimal Markdown)
  const renderCleanText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Very simple replacement for bold **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="mb-3">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-white font-black">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#050a14] text-white p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center border-b border-slate-800 pb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-lg">
            <i className="fas fa-bolt text-2xl"></i>
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">DC Circuit Master</h1>
        </div>
        
        <nav className="flex bg-slate-900 p-1 rounded-full border border-slate-800 overflow-x-auto max-w-full">
          {[CircuitType.SERIES, CircuitType.PARALLEL, CircuitType.COMBINATION].map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === type ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Schematic Section */}
        <section className="lg:col-span-7 bg-[#0a1120] border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-blue-400">
              <i className="fas fa-microchip"></i> Schematic View
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Solve For:</span>
              <span className="text-xs font-black text-red-500">{circuit?.targetParameter}</span>
            </div>
          </div>
          
          {circuit && <CircuitSchematic data={circuit} />}

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 text-center transition-all hover:border-red-600/30">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Source</p>
              <p className="text-2xl font-black text-red-500">
                {circuit?.targetParameter === 'Vtotal' ? '???' : `${circuit?.sourceVoltage}V`}
              </p>
            </div>
            <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 text-center transition-all hover:border-red-600/30">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Total Current</p>
              <p className="text-2xl font-black text-white">
                {circuit?.targetParameter === 'Itotal' ? '???' : `${circuit?.givenCurrent}A`}
              </p>
            </div>
            <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 text-center transition-all hover:border-red-600/30">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Status</p>
              <p className="text-sm font-bold text-slate-400 uppercase">Calc Required</p>
            </div>
          </div>
        </section>

        {/* Problem & Interaction Section */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-[#0a1120] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <i className="fas fa-question-circle text-6xl"></i>
            </div>
            <h2 className="text-xl font-black uppercase italic mb-2 tracking-tighter">Current Objective</h2>
            <div className="h-0.5 w-12 bg-red-600 mb-6"></div>

            <p className="text-slate-200 text-lg leading-relaxed mb-6 font-medium">
              {getProblemText()}
            </p>

            <div className="relative mb-6">
              <input 
                type="text" 
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Value..."
                className="w-full bg-slate-950 border-2 border-slate-800 focus:border-red-600 rounded-xl py-4 px-6 text-2xl font-mono outline-none transition-all placeholder:text-slate-800"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-red-500 text-xl font-black">
                {circuit?.unit}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleCheckAnswer}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-red-900/20"
              >
                Submit
              </button>
              <button 
                onClick={generateProblem}
                className="flex-1 bg-[#1e293b] hover:bg-[#334155] text-white font-black uppercase py-4 rounded-xl transition-all shadow-lg"
              >
                Next Problem
              </button>
            </div>

            {feedback.type && (
              <div className={`mt-6 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${
                feedback.type === 'success' ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-red-900/20 border-red-800 text-red-400'
              }`}>
                <i className={`fas ${feedback.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                <p className="text-sm font-bold">{feedback.message}</p>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400/80">
                <i className="fas fa-graduation-cap"></i>
                <span className="text-[10px] uppercase font-bold tracking-widest">Tutor Assistance</span>
              </div>
              <button 
                onClick={handleAskAi}
                disabled={isAiLoading}
                className="px-4 py-2 border border-blue-500/50 text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-500/10 transition-colors flex items-center gap-2"
              >
                {isAiLoading ? 'THINKING...' : 'EXPLAIN HOW'}
              </button>
            </div>
          </div>

          <button 
            onClick={() => setShowCalc(!showCalc)}
            className="w-full bg-[#1e293b]/30 border border-slate-800 hover:border-red-600/50 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-xs transition-all text-slate-400 hover:text-red-500"
          >
            <i className="fas fa-calculator"></i> {showCalc ? 'HIDE CALCULATOR' : 'OPEN CALCULATOR'}
          </button>

          {/* AI Explanation Result */}
          {aiExplanation && (
            <div className="bg-[#0a1120] border border-blue-800/50 rounded-2xl p-6 shadow-xl animate-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <i className="fas fa-lightbulb text-yellow-400"></i>
                  <h3 className="font-bold text-blue-400 uppercase text-xs tracking-widest">Step-by-Step Guide</h3>
                </div>
                <button onClick={() => setAiExplanation(null)} className="text-slate-600 hover:text-white transition-colors">
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>
              <div className="text-sm text-slate-300 leading-relaxed custom-scrollbar max-h-96 overflow-y-auto pr-3">
                <div className="prose-slate">
                   {renderCleanText(aiExplanation)}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Learning Lab Section */}
      <footer className="bg-[#0a1120] border border-slate-800 rounded-2xl p-8 mb-12 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <i className="fas fa-info-circle text-red-500 text-xl"></i>
          <h2 className="text-xl font-bold uppercase tracking-tighter italic">Reference Panel</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="group bg-slate-950/50 p-4 rounded-xl border border-slate-800 transition-colors hover:border-red-900/50">
            <h4 className="text-red-400 font-black uppercase text-[10px] tracking-widest mb-2">Ohm's Law</h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-2">Fundamental relation between V, I, and R.</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-white font-mono bg-slate-900 px-2 py-1 rounded text-xs border border-slate-700">V = I × R</span>
              <span className="text-white font-mono bg-slate-900 px-2 py-1 rounded text-xs border border-slate-700">I = V / R</span>
              <span className="text-white font-mono bg-slate-900 px-2 py-1 rounded text-xs border border-slate-700">R = V / I</span>
            </div>
          </div>
          <div className="group bg-slate-950/50 p-4 rounded-xl border border-slate-800 transition-colors hover:border-red-900/50">
            <h4 className="text-red-400 font-black uppercase text-[10px] tracking-widest mb-2">Series Circuits</h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-2">Resistance adds up. Current is constant.</p>
            <span className="text-white font-mono bg-slate-900 px-2 py-1 rounded text-xs border border-slate-700">Req = R1 + R2 + R3</span>
          </div>
          <div className="group bg-slate-950/50 p-4 rounded-xl border border-slate-800 transition-colors hover:border-red-900/50">
            <h4 className="text-red-400 font-black uppercase text-[10px] tracking-widest mb-2">Parallel Circuits</h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-2">Voltage is constant. Conductance adds up.</p>
            <span className="text-white font-mono bg-slate-900 px-2 py-1 rounded text-xs border border-slate-700">1/Req = 1/R1 + 1/R2 + 1/R3</span>
          </div>
        </div>
      </footer>

      {showCalc && <Calculator onClose={() => setShowCalc(false)} />}
    </div>
  );
};

export default App;
