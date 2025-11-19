export enum ShapeType {
  PERSEGI = 'Persegi',
  SEGITIGA_SAMA_SISI = 'Segitiga Sama Sisi',
  PERSEGI_PANJANG = 'Persegi Panjang',
  SEGITIGA_SIKU_SIKU = 'Segitiga Siku-Siku',
  TRAPESIUM_SIKU_SIKU = 'Trapesium Siku-Siku',
}

export interface Dimensions {
  sisi?: number;
  panjang?: number;
  lebar?: number;
  alas?: number;
  tinggi?: number;
  miring?: number;
  sisiAtas?: number;
  sisiBawah?: number;
}

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
