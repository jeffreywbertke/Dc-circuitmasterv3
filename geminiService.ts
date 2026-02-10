
import { GoogleGenAI } from "@google/genai";
import { CircuitData, CircuitType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getCircuitExplanation = async (circuit: CircuitData): Promise<string> => {
  const model = 'gemini-3-flash-preview';
  
  const resistorsList = circuit.resistors.map((r, i) => `R${i+1} = ${r.value}Ω`).join(', ');
  
  // Map target parameter to human-friendly terms
  const objectiveMap = {
    'Req': 'Total Equivalent Resistance (Req)',
    'Itotal': 'Total Current (Itotal)',
    'Vtotal': 'Total Source Voltage (Vtotal)'
  };

  const prompt = `
    You are an expert electrical engineering tutor. 
    Explain step-by-step how to solve this DC circuit problem:
    
    Circuit Type: ${circuit.type}
    Source Voltage: ${circuit.targetParameter === 'Vtotal' ? 'Unknown' : circuit.sourceVoltage + 'V'}
    Resistors: ${resistorsList}
    Objective: Find the ${objectiveMap[circuit.targetParameter]}.
    ${circuit.targetParameter === 'Vtotal' ? `Known Total Current: ${circuit.givenCurrent}A` : ''}
    
    IMPORTANT FORMATTING RULES:
    1. DO NOT use LaTeX math delimiters (no $$ or \[ \]).
    2. DO NOT use complex math syntax like \frac or \Omega.
    3. Use standard text characters: Use 'Ω' for ohms, 'A' for amps, 'V' for volts.
    4. Use simple text formulas: e.g., "R_total = R1 + R2" or "I = V / R".
    5. Keep the explanation clear, educational, and broken into simple numbered steps.
    6. Use standard Markdown for bolding and lists ONLY.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "I'm sorry, I couldn't generate an explanation right now.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to AI tutor. Please check your internet connection.";
  }
};
