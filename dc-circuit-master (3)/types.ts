
export enum CircuitType {
  SERIES = 'SERIES',
  PARALLEL = 'PARALLEL',
  COMBINATION = 'COMBINATION'
}

export interface Resistor {
  id: string;
  value: number;
}

export type TargetParameter = 'Req' | 'Itotal' | 'Vtotal';

export interface CircuitData {
  type: CircuitType;
  sourceVoltage: number;
  resistors: Resistor[];
  targetParameter: TargetParameter;
  correctAnswer: number;
  unit: string;
  givenCurrent?: number; // Used when solving for Voltage
}

export interface ExplanationStep {
  text: string;
  formula?: string;
}
