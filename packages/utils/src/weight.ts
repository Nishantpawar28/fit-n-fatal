export type WeightUnit = 'kg' | 'lbs';

const KG_TO_LBS = 2.20462;

export function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / KG_TO_LBS) * 10) / 10;
}

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value;
  return from === 'kg' ? kgToLbs(value) : lbsToKg(value);
}

export function formatWeight(value: number, unit: WeightUnit): string {
  return `${value} ${unit}`;
}

export function calculateVolume(reps: number, weight: number): number {
  return reps * weight;
}

export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}
