export enum ShapeType {
  PERSEGI = 'Persegi',
  SEGITIGA_SAMA_SISI = 'Segitiga Sama Sisi',
  PERSEGI_PANJANG = 'Persegi Panjang',
  SEGITIGA_SIKU_SIKU = 'Segitiga Siku-Siku',
  TRAPESIUM_SIKU_SIKU = 'Trapesium Siku-Siku',
}

// Changed to a Record to support dynamic keys like s1, s2, top, bottom, etc.
export type Dimensions = Record<string, number>;

export interface ValidationResult {
  isValid: boolean;
  perimeter: number | null;
  message: string;
}

export interface AIAnalysisResult {
  advice: string;
  loading: boolean;
  error: string | null;
}