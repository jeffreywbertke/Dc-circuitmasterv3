
import React from 'react';
import { CircuitData, CircuitType } from '../types';

interface Props {
  data: CircuitData;
}

const CircuitSchematic: React.FC<Props> = ({ data }) => {
  const { type, resistors, sourceVoltage, targetParameter } = data;

  const renderResistorIcon = (x: number, y: number, label: string, value: number, rotation = 0) => (
    <g transform={`translate(${x},${y}) rotate(${rotation})`} className="transition-all duration-500">
      {/* Resistor symbol: zigzag */}
      <path 
        d="M -22 0 L -16 0 L -13 -6 L -8 6 L -3 -6 L 2 6 L 7 -6 L 12 6 L 16 0 L 22 0" 
        fill="none" 
        stroke="white" 
        strokeWidth="3" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Expanded spacing: Label further above, Value further below */}
      <text 
        x="0" 
        y="-35" 
        fill="#ef4444" 
        fontSize="16" 
        textAnchor="middle" 
        fontWeight="900" 
        className="uppercase tracking-[0.1em]"
        transform={`rotate(${-rotation})`}
      >
        {label}
      </text>
      <text 
        x="0" 
        y="35" 
        fill="#ffffff" 
        fontSize="14" 
        textAnchor="middle" 
        fontWeight="black"
        transform={`rotate(${-rotation})`}
      >
        {value}Ω
      </text>
    </g>
  );

  const renderBattery = (x: number, y: number) => {
    // If we're solving for Vtotal, show a question mark instead of the value
    const displayVoltage = targetParameter === 'Vtotal' ? '??' : sourceVoltage;

    return (
      <g transform={`translate(${x},${y})`}>
        {/* Battery symbol lines */}
        <line x1="0" y1="-25" x2="0" y2="25" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
        <line x1="-10" y1="-15" x2="-10" y2="15" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
        <line x1="-20" y1="-25" x2="-20" y2="25" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
        <line x1="-30" y1="-15" x2="-30" y2="15" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
        
        {/* Polarity symbols */}
        <text x="12" y="-18" fill="#ef4444" fontSize="14" fontWeight="black" textAnchor="middle">+</text>
        <text x="12" y="24" fill="#ef4444" fontSize="14" fontWeight="black" textAnchor="middle">-</text>

        {/* Source Voltage Label - Large, positioned to the left with padding */}
        <text 
          x="-45" 
          y="2" 
          fill="#ffffff" 
          fontSize="28" 
          fontWeight="900" 
          textAnchor="end" 
          dominantBaseline="middle"
          className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        >
          {displayVoltage}V
        </text>
        <text 
          x="-45" 
          y="-25" 
          fill="#ef4444" 
          fontSize="11" 
          fontWeight="black" 
          textAnchor="end" 
          textTransform="uppercase" 
          letterSpacing="0.15em"
        >
          Source
        </text>
      </g>
    );
  };

  return (
    <div className="w-full flex-grow bg-[#050a14] rounded-xl border border-slate-800/50 relative flex items-center justify-center p-8 overflow-hidden">
      <svg 
        viewBox="0 0 500 350" 
        className="w-full h-full max-h-[400px] drop-shadow-2xl"
      >
        <defs>
          <radialGradient id="batteryGlow" cx="120" cy="175" r="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="120" cy="175" r="100" fill="url(#batteryGlow)" />

        {/* Outer path - Spaced out more than before */}
        <rect 
          x="120" 
          y="75" 
          width="320" 
          height="200" 
          fill="none" 
          stroke="#1e293b" 
          strokeWidth="4" 
          strokeDasharray="10,8" 
          className="animate-[dash_20s_linear_infinite]" 
        />
        
        {/* Battery at the center left of the loop */}
        {renderBattery(120, 175)}

        {/* Component Placement */}
        {type === CircuitType.SERIES && (
          <>
            {renderResistorIcon(280, 75, "R1", resistors[0]?.value || 0)}
            {renderResistorIcon(440, 175, "R2", resistors[1]?.value || 0, 90)}
            {renderResistorIcon(280, 275, "R3", resistors[2]?.value || 0)}
          </>
        )}

        {type === CircuitType.PARALLEL && (
          <>
            {/* Branch nodes */}
            <line x1="240" y1="75" x2="240" y2="275" stroke="#1e293b" strokeWidth="4" />
            <line x1="340" y1="75" x2="340" y2="275" stroke="#1e293b" strokeWidth="4" />
            <line x1="440" y1="75" x2="440" y2="275" stroke="#1e293b" strokeWidth="4" />
            
            {renderResistorIcon(240, 175, "R1", resistors[0]?.value || 0, 90)}
            {renderResistorIcon(340, 175, "R2", resistors[1]?.value || 0, 90)}
            {renderResistorIcon(440, 175, "R3", resistors[2]?.value || 0, 90)}
          </>
        )}

        {type === CircuitType.COMBINATION && (
          <>
            {/* R1 in series with the parallel block */}
            {renderResistorIcon(190, 75, "R1", resistors[0]?.value || 0)}
            
            {/* Parallel Block Wires */}
            <line x1="280" y1="75" x2="380" y2="75" stroke="#1e293b" strokeWidth="4" />
            <line x1="280" y1="75" x2="280" y2="195" stroke="#1e293b" strokeWidth="4" />
            <line x1="380" y1="75" x2="380" y2="195" stroke="#1e293b" strokeWidth="4" />
            <line x1="280" y1="195" x2="380" y2="195" stroke="#1e293b" strokeWidth="4" />
            <line x1="330" y1="195" x2="330" y2="275" stroke="#1e293b" strokeWidth="4" />
            
            {renderResistorIcon(280, 135, "R2", resistors[1]?.value || 0, 90)}
            {renderResistorIcon(380, 135, "R3", resistors[2]?.value || 0, 90)}
          </>
        )}
      </svg>
      
      {/* Schematic Meta */}
      <div className="absolute top-6 left-6 flex flex-col gap-0.5">
        <span className="text-[10px] text-red-500 font-black uppercase tracking-[0.2em]">Schematic Active</span>
        <span className="text-[8px] text-slate-500 font-mono">ID: DC-PRB-{Math.floor(Math.random()*1000)}</span>
      </div>

      <div className="absolute bottom-6 right-6 flex items-center gap-2">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Calculated Real-Time</span>
        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></div>
      </div>
    </div>
  );
};

export default CircuitSchematic;
