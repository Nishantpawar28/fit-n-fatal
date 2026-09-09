export type WaterUnitType = 'ml' | 'oz';

const ML_PER_OZ = 29.5735;

export function mlToOz(ml: number): number {
  return Math.round((ml / ML_PER_OZ) * 10) / 10;
}

export function ozToMl(oz: number): number {
  return Math.round(oz * ML_PER_OZ);
}

export function formatWater(ml: number, unit: WaterUnitType): string {
  if (unit === 'oz') return `${mlToOz(ml)} oz`;
  if (ml >= 1000) return `${(ml / 1000).toFixed(2).replace(/\.00$/, '')} L`;
  return `${ml} ml`;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54 * 10) / 10;
}

export function formatHeight(cm: number | null, unit: 'cm' | 'ft_in'): string {
  if (cm == null) return '—';
  if (unit === 'cm') return `${cm} cm`;
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}'${inches}"`;
}
