import React, { useState, useEffect } from 'react';
import { ShapeType, Dimensions, ValidationResult, AIAnalysisResult } from './types';
import { getTuqangAdvice } from './services/geminiService';
import { 
  Square, 
  Triangle, 
  RectangleHorizontal, 
  Scaling, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Bot,
  Ruler,
  Info,
  ArrowRight
} from 'lucide-react';

// --- Component: Header ---
const Header: React.FC = () => (
  <header className="border-b border-slate-700 bg-tuqang-dark/95 backdrop-blur sticky top-0 z-50">
    <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-tuqang-orange p-2 rounded-lg">
          <Ruler className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Validator <span className="text-tuqang-orange">TuQang</span> x AI</h1>
          <p className="text-xs text-slate-400">Presisi Bangunan & Kecerdasan Buatan</p>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-2 text-xs font-mono text-tuqang-accent bg-slate-800 px-3 py-1 rounded-full">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        System Ready
      </div>
    </div>
  </header>
);

// --- Component: Shape Selector ---
interface ShapeSelectorProps {
  selected: ShapeType;
  onSelect: (shape: ShapeType) => void;
}

const ShapeSelector: React.FC<ShapeSelectorProps> = ({ selected, onSelect }) => {
  const shapes = [
    { type: ShapeType.PERSEGI, icon: Square },
    { type: ShapeType.SEGITIGA_SAMA_SISI, icon: Triangle },
    { type: ShapeType.PERSEGI_PANJANG, icon: RectangleHorizontal },
    { type: ShapeType.SEGITIGA_SIKU_SIKU, icon: Scaling },
    { type: ShapeType.TRAPESIUM_SIKU_SIKU, icon: Activity },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
      {shapes.map((s) => {
        const Icon = s.icon;
        const isActive = selected === s.type;
        return (
          <button
            key={s.type}
            onClick={() => onSelect(s.type)}
            className={`
              flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200
              ${isActive 
                ? 'bg-tuqang-orange/10 border-tuqang-orange text-tuqang-orange shadow-[0_0_20px_rgba(249,115,22,0.2)]' 
                : 'bg-tuqang-card border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'}
            `}
          >
            <Icon className={`w-6 h-6 mb-2 ${isActive ? 'text-tuqang-orange' : 'text-slate-400'}`} />
            <span className="text-xs font-medium text-center">{s.type}</span>
          </button>
        );
      })}
    </div>
  );
};

// --- Config for Dynamic Inputs ---
interface InputConfig {
  key: string;
  label: string;
  placeholder?: string;
}

const SHAPE_INPUTS: Record<ShapeType, InputConfig[]> = {
  [ShapeType.PERSEGI]: [
    { key: 's1', label: 'Sisi Atas' },
    { key: 's2', label: 'Sisi Kanan' },
    { key: 's3', label: 'Sisi Bawah' },
    { key: 's4', label: 'Sisi Kiri' },
  ],
  [ShapeType.SEGITIGA_SAMA_SISI]: [
    { key: 's1', label: 'Sisi A' },
    { key: 's2', label: 'Sisi B' },
    { key: 's3', label: 'Sisi C' },
  ],
  [ShapeType.PERSEGI_PANJANG]: [
    { key: 'p_atas', label: 'Sisi Atas (Panjang)' },
    { key: 'l_kanan', label: 'Sisi Kanan (Lebar)' },
    { key: 'p_bawah', label: 'Sisi Bawah (Panjang)' },
    { key: 'l_kiri', label: 'Sisi Kiri (Lebar)' },
  ],
  [ShapeType.SEGITIGA_SIKU_SIKU]: [
    { key: 'alas', label: 'Sisi Alas' },
    { key: 'tinggi', label: 'Sisi Tegak (Tinggi)' },
    { key: 'miring', label: 'Sisi Miring' },
  ],
  [ShapeType.TRAPESIUM_SIKU_SIKU]: [
    { key: 'atas', label: 'Sisi Atas' },
    { key: 'bawah', label: 'Sisi Bawah' },
    { key: 'tinggi', label: 'Sisi Tegak (Tinggi)' },
    { key: 'miring', label: 'Sisi Miring' },
  ],
};

// --- Main App Component ---
const App: React.FC = () => {
  const [selectedShape, setSelectedShape] = useState<ShapeType>(ShapeType.PERSEGI);
  const [dimensions, setDimensions] = useState<Dimensions>({});
  const [result, setResult] = useState<ValidationResult>({ isValid: false, perimeter: null, message: 'Masukkan semua ukuran sisi.' });
  const [aiState, setAiState] = useState<AIAnalysisResult>({ advice: '', loading: false, error: null });

  // Reset state when shape changes
  useEffect(() => {
    setDimensions({});
    setResult({ isValid: false, perimeter: null, message: 'Masukkan ukuran sisi.' });
    setAiState({ advice: '', loading: false, error: null });
  }, [selectedShape]);

  // Validation Logic
  const validateAndCalculate = () => {
    const d = dimensions;
    const configs = SHAPE_INPUTS[selectedShape];
    
    // Check if all required fields have values > 0
    const allFilled = configs.every(c => d[c.key] !== undefined && d[c.key] > 0);
    if (!allFilled) {
      setResult({ isValid: false, perimeter: null, message: "Lengkapi semua sisi dengan nilai > 0." });
      return;
    }

    let valid = false;
    let peri = 0;
    let msg = "";
    const EPSILON = 0.1; // Tolerance

    // Helper to get value safely
    const val = (k: string) => d[k] || 0;

    switch (selectedShape) {
      case ShapeType.PERSEGI: {
        const sides = [val('s1'), val('s2'), val('s3'), val('s4')];
        // Check if all sides are equal
        const first = sides[0];
        const allEqual = sides.every(s => Math.abs(s - first) < EPSILON);
        
        if (allEqual) {
          valid = true;
          peri = sides.reduce((a, b) => a + b, 0);
          msg = "Valid. Semua sisi sama panjang.";
        } else {
          msg = "Tidak Valid. Untuk menjadi Persegi, ke-4 sisi harus sama panjang.";
        }
        break;
      }

      case ShapeType.SEGITIGA_SAMA_SISI: {
        const sides = [val('s1'), val('s2'), val('s3')];
        const first = sides[0];
        const allEqual = sides.every(s => Math.abs(s - first) < EPSILON);

        if (allEqual) {
          valid = true;
          peri = sides.reduce((a, b) => a + b, 0);
          msg = "Valid. Ketiga sisi sama panjang.";
        } else {
          msg = "Tidak Valid. Segitiga Sama Sisi harus memiliki panjang sisi yang identik.";
        }
        break;
      }

      case ShapeType.PERSEGI_PANJANG: {
        const top = val('p_atas');
        const right = val('l_kanan');
        const bottom = val('p_bawah');
        const left = val('l_kiri');

        // Opposite sides must be equal
        const horizontalEqual = Math.abs(top - bottom) < EPSILON;
        const verticalEqual = Math.abs(right - left) < EPSILON;
        
        // Should not be a square (technically a square is a rectangle, but usually distinguished in apps)
        // But strictly speaking geometrically, square inputs are valid rectangles. 
        // However, for logic check:
        if (horizontalEqual && verticalEqual) {
          valid = true;
          peri = top + right + bottom + left;
          msg = "Valid. Sisi yang berhadapan sama panjang.";
        } else {
          msg = "Tidak Valid. Sisi yang berhadapan (Atas-Bawah atau Kiri-Kanan) tidak sama.";
        }
        break;
      }

      case ShapeType.SEGITIGA_SIKU_SIKU: {
        const a = val('alas');
        const t = val('tinggi');
        const m = val('miring');
        
        const pythagoras = Math.sqrt(a**2 + t**2);
        
        if (Math.abs(pythagoras - m) < EPSILON) {
          valid = true;
          peri = a + t + m;
          msg = "Valid. Sisi-sisi memenuhi teorema Pythagoras.";
        } else {
          msg = `Tidak Valid. Dengan alas ${a} dan tinggi ${t}, sisi miring seharusnya ±${pythagoras.toFixed(2)}.`;
        }
        break;
      }

      case ShapeType.TRAPESIUM_SIKU_SIKU: {
        const a = val('atas');
        const b = val('bawah');
        const t = val('tinggi');
        const m = val('miring');

        // Logic: The horizontal difference between top and bottom creates a small triangle with the height
        const diffBase = Math.abs(b - a);
        const calculatedHypotenuse = Math.sqrt(diffBase**2 + t**2);

        if (Math.abs(calculatedHypotenuse - m) < EPSILON) {
          valid = true;
          peri = a + b + t + m;
          msg = "Valid. Ukuran sisi miring sesuai dengan tinggi dan selisih sisi sejajar.";
        } else {
          msg = `Tidak Valid. Geometri tidak menutup. Sisi miring seharusnya ±${calculatedHypotenuse.toFixed(2)}.`;
        }
        break;
      }
    }

    setResult({ isValid: valid, perimeter: valid ? parseFloat(peri.toFixed(2)) : null, message: msg });
  };

  // Trigger validation whenever dimensions change
  useEffect(() => {
    const configs = SHAPE_INPUTS[selectedShape];
    // Only run logic if we have inputs (even partial) to clear errors or show progress
    if (Object.keys(dimensions).length > 0) {
      validateAndCalculate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions, selectedShape]);

  const handleInputChange = (key: string, value: string) => {
    const numVal = parseFloat(value);
    setDimensions(prev => ({
      ...prev,
      [key]: isNaN(numVal) ? undefined : numVal
    }));
  };

  const askAI = async () => {
    setAiState(prev => ({ ...prev, loading: true, error: null, advice: '' }));
    // We pass the dimensions object directly, logic in service handles the JSON stringify
    const advice = await getTuqangAdvice(selectedShape, dimensions, result.isValid);
    setAiState({ loading: false, error: null, advice });
  };

  // --- Render Input Fields ---
  const renderInputs = () => {
    const inputs = SHAPE_INPUTS[selectedShape];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inputs.map((input) => (
          <div key={input.key} className="animate-in slide-in-from-left-2 duration-300">
            <label className="block text-sm font-medium text-slate-400 mb-1">{input.label}</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 pl-4 text-white focus:ring-2 focus:ring-tuqang-orange focus:outline-none transition-all placeholder-slate-600"
                placeholder={input.placeholder || "0"}
                value={dimensions[input.key] ?? ''}
                onChange={(e) => handleInputChange(input.key, e.target.value)}
              />
              <div className="absolute right-3 top-3 text-slate-500 text-xs pointer-events-none">
                unit
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const totalInputs = SHAPE_INPUTS[selectedShape].length;
  const filledInputs = Object.keys(dimensions).filter(k => dimensions[k] !== undefined && dimensions[k] > 0).length;
  const isComplete = filledInputs >= totalInputs;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-grow p-4 md:p-8 max-w-5xl mx-auto w-full">
        
        <div className="mb-6 text-center md:text-left">
          <h2 className="text-3xl font-bold text-white mb-2">Pilih Bangun Datar</h2>
          <p className="text-slate-400">Masukkan ukuran <span className="text-tuqang-orange font-semibold">per sisi</span> untuk divalidasi.</p>
        </div>

        <ShapeSelector selected={selectedShape} onSelect={setSelectedShape} />

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-tuqang-card rounded-2xl p-6 border border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-tuqang-accent" />
                  Input {totalInputs} Sisi
                </h3>
                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">{selectedShape}</span>
              </div>
              
              {renderInputs()}

              <div className="mt-6 pt-6 border-t border-slate-700 flex justify-end">
                <button 
                  onClick={askAI}
                  disabled={!isComplete || aiState.loading}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all
                    ${!isComplete
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-tuqang-orange to-red-500 hover:to-red-600 text-white shadow-lg hover:shadow-orange-500/20'}
                  `}
                >
                   {aiState.loading ? (
                     <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-4 h-4"></span>
                   ) : (
                     <Bot className="w-5 h-5" />
                   )}
                   {aiState.loading ? 'Menghubungi Mandor...' : 'Analisis TuQang AI'}
                </button>
              </div>
            </div>

            {/* AI Analysis Box */}
            {aiState.advice && (
              <div className="bg-slate-800/50 border border-tuqang-accent/30 rounded-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95">
                <div className="absolute top-0 left-0 w-1 h-full bg-tuqang-accent"></div>
                <h4 className="text-tuqang-accent font-bold mb-2 flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Kata Mandor AI:
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  "{aiState.advice}"
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Result & Visualization */}
          <div className="lg:col-span-5">
            <div className={`
              h-full rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-500 relative overflow-hidden
              ${result.isValid 
                ? 'bg-tuqang-success/10 border border-tuqang-success/50' 
                : isComplete && !result.isValid
                  ? 'bg-tuqang-error/10 border border-tuqang-error/50'
                  : 'bg-slate-800 border border-slate-700 dashed-border'}
            `}>
              
              {/* Status Icon */}
              <div className="mb-6">
                 {result.isValid ? (
                   <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                     <CheckCircle className="w-10 h-10 text-green-500" />
                   </div>
                 ) : isComplete && !result.isValid ? (
                   <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                      <XCircle className="w-10 h-10 text-red-500" />
                   </div>
                 ) : (
                   <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto">
                      <Ruler className="w-8 h-8 text-slate-500" />
                   </div>
                 )}
              </div>

              {/* Validation Message */}
              <h3 className={`text-2xl font-bold mb-2 ${
                result.isValid ? 'text-green-400' : (isComplete && !result.isValid) ? 'text-red-400' : 'text-slate-500'
              }`}>
                {result.isValid ? 'UKURAN VALID' : (isComplete && !result.isValid) ? 'TIDAK PRESISI' : 'Menunggu Input'}
              </h3>
              
              <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
                {result.message}
              </p>

              {/* Perimeter Result */}
              {result.isValid && (
                <div className="w-full bg-slate-900/50 rounded-xl p-4 border border-slate-700 animate-in slide-in-from-bottom-4">
                  <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Total Keliling</p>
                  <p className="text-4xl font-mono font-bold text-white tracking-tighter flex items-center justify-center gap-2">
                    {result.perimeter} 
                    <span className="text-lg text-tuqang-orange font-sans font-normal">unit</span>
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Siap dikerjakan
                  </div>
                </div>
              )}
              
              {!isComplete && (
                <div className="flex items-center gap-2 text-slate-600 text-sm bg-slate-900/30 px-4 py-2 rounded-full">
                  <ArrowRight className="w-4 h-4 animate-pulse" />
                  Isi {totalInputs - filledInputs} sisi lagi
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-slate-600 text-sm">
        &copy; {new Date().getFullYear()} TuQang Digital Construction Tools.
      </footer>
    </div>
  );
};

export default App;