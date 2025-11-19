import React, { useState, useEffect, useMemo } from 'react';
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
  Info
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
    { type: ShapeType.SEGITIGA_SIKU_SIKU, icon: Scaling }, // Visual metaphor
    { type: ShapeType.TRAPESIUM_SIKU_SIKU, icon: Activity }, // Visual metaphor
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

// --- Main App Component ---
const App: React.FC = () => {
  const [selectedShape, setSelectedShape] = useState<ShapeType>(ShapeType.PERSEGI);
  const [dimensions, setDimensions] = useState<Dimensions>({});
  const [result, setResult] = useState<ValidationResult>({ isValid: false, perimeter: null, message: 'Masukkan ukuran untuk memulai.' });
  const [aiState, setAiState] = useState<AIAnalysisResult>({ advice: '', loading: false, error: null });

  // Reset state when shape changes
  useEffect(() => {
    setDimensions({});
    setResult({ isValid: false, perimeter: null, message: 'Masukkan ukuran baru.' });
    setAiState({ advice: '', loading: false, error: null });
  }, [selectedShape]);

  // Validation Logic
  const validateAndCalculate = () => {
    const d = dimensions;
    let valid = false;
    let peri = 0;
    let msg = "";

    const EPSILON = 0.05; // Tolerance for user inputs (e.g., measuring errors)

    switch (selectedShape) {
      case ShapeType.PERSEGI:
        if (d.sisi && d.sisi > 0) {
          valid = true;
          peri = 4 * d.sisi;
          msg = "Ukuran valid. Bentuk Persegi sempurna.";
        } else {
          msg = "Sisi harus lebih dari 0.";
        }
        break;

      case ShapeType.SEGITIGA_SAMA_SISI:
        if (d.sisi && d.sisi > 0) {
          valid = true;
          peri = 3 * d.sisi;
          msg = "Ukuran valid. Segitiga Sama Sisi.";
        } else {
          msg = "Sisi harus lebih dari 0.";
        }
        break;

      case ShapeType.PERSEGI_PANJANG:
        if (d.panjang && d.lebar && d.panjang > 0 && d.lebar > 0) {
          valid = true;
          peri = 2 * (d.panjang + d.lebar);
          msg = "Ukuran valid. Persegi Panjang.";
        } else {
          msg = "Panjang dan Lebar harus lebih dari 0.";
        }
        break;

      case ShapeType.SEGITIGA_SIKU_SIKU:
        // a^2 + b^2 = c^2
        if (d.alas && d.tinggi && d.miring && d.alas > 0 && d.tinggi > 0 && d.miring > 0) {
          const pythagoras = Math.sqrt(d.alas ** 2 + d.tinggi ** 2);
          const diff = Math.abs(pythagoras - d.miring);
          
          if (diff < EPSILON) {
            valid = true;
            peri = d.alas + d.tinggi + d.miring;
            msg = "Ukuran valid. Memenuhi teorema Pythagoras.";
          } else {
            msg = `Tidak Valid. Untuk alas ${d.alas} dan tinggi ${d.tinggi}, sisi miring seharusnya ±${pythagoras.toFixed(2)}, bukan ${d.miring}.`;
          }
        } else {
          msg = "Semua sisi harus diisi > 0.";
        }
        break;

      case ShapeType.TRAPESIUM_SIKU_SIKU:
        // Need top, bottom, height, slant
        if (d.sisiAtas && d.sisiBawah && d.tinggi && d.miring && 
            d.sisiAtas > 0 && d.sisiBawah > 0 && d.tinggi > 0 && d.miring > 0) {
          
          const diffBase = Math.abs(d.sisiBawah - d.sisiAtas);
          const calcSlant = Math.sqrt(diffBase ** 2 + d.tinggi ** 2);
          const diff = Math.abs(calcSlant - d.miring);

          if (diff < EPSILON) {
            valid = true;
            peri = d.sisiAtas + d.sisiBawah + d.tinggi + d.miring;
            msg = "Ukuran valid. Trapesium Siku-Siku terbentuk sempurna.";
          } else {
             msg = `Tidak Valid. Sisi miring tidak sesuai geometri. Seharusnya ±${calcSlant.toFixed(2)}.`;
          }
        } else {
          msg = "Semua sisi harus diisi > 0.";
        }
        break;
    }

    setResult({ isValid: valid, perimeter: valid ? parseFloat(peri.toFixed(2)) : null, message: msg });
    return valid;
  };

  // Trigger validation whenever dimensions change
  useEffect(() => {
    const hasKeys = Object.keys(dimensions).length > 0;
    if (hasKeys) validateAndCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions]);

  const handleInputChange = (key: keyof Dimensions, value: string) => {
    const numVal = parseFloat(value);
    setDimensions(prev => ({
      ...prev,
      [key]: isNaN(numVal) ? undefined : numVal
    }));
  };

  const askAI = async () => {
    setAiState(prev => ({ ...prev, loading: true, error: null, advice: '' }));
    const advice = await getTuqangAdvice(selectedShape, dimensions, result.isValid);
    setAiState({ loading: false, error: null, advice });
  };

  // --- Render Helpers ---
  const renderInputs = () => {
    const inputClass = "w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-tuqang-orange focus:outline-none transition-all";
    const labelClass = "block text-sm font-medium text-slate-400 mb-1";

    const Field = ({ label, fieldKey, placeholder }: { label: string, fieldKey: keyof Dimensions, placeholder?: string }) => (
      <div className="mb-4">
        <label className={labelClass}>{label}</label>
        <input
          type="number"
          step="0.1"
          className={inputClass}
          placeholder={placeholder || "0"}
          value={dimensions[fieldKey] ?? ''}
          onChange={(e) => handleInputChange(fieldKey, e.target.value)}
        />
      </div>
    );

    switch (selectedShape) {
      case ShapeType.PERSEGI:
      case ShapeType.SEGITIGA_SAMA_SISI:
        return <Field label="Panjang Sisi (s)" fieldKey="sisi" />;
      case ShapeType.PERSEGI_PANJANG:
        return (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Panjang (p)" fieldKey="panjang" />
            <Field label="Lebar (l)" fieldKey="lebar" />
          </div>
        );
      case ShapeType.SEGITIGA_SIKU_SIKU:
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Alas (a)" fieldKey="alas" />
              <Field label="Tinggi (t)" fieldKey="tinggi" />
            </div>
            <Field label="Sisi Miring (Hipotenusa)" fieldKey="miring" placeholder="Hasil a² + t²..." />
          </div>
        );
      case ShapeType.TRAPESIUM_SIKU_SIKU:
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Sisi Atas (a)" fieldKey="sisiAtas" />
              <Field label="Sisi Bawah (b)" fieldKey="sisiBawah" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tinggi (t)" fieldKey="tinggi" />
              <Field label="Sisi Miring (c)" fieldKey="miring" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-grow p-4 md:p-8 max-w-5xl mx-auto w-full">
        
        <div className="mb-6 text-center md:text-left">
          <h2 className="text-3xl font-bold text-white mb-2">Pilih Bangun Datar</h2>
          <p className="text-slate-400">Pilih jenis bangun dan masukkan ukuran untuk memvalidasi presisinya.</p>
        </div>

        <ShapeSelector selected={selectedShape} onSelect={setSelectedShape} />

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-tuqang-card rounded-2xl p-6 border border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-tuqang-accent" />
                  Input Parameter
                </h3>
                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">{selectedShape}</span>
              </div>
              
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {renderInputs()}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700 flex justify-end">
                <button 
                  onClick={askAI}
                  disabled={Object.keys(dimensions).length === 0 || aiState.loading}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all
                    ${Object.keys(dimensions).length === 0 
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
              <div className="bg-slate-800/50 border border-tuqang-accent/30 rounded-2xl p-6 relative overflow-hidden">
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
                : result.perimeter !== null // Valid shape type but invalid geometry
                  ? 'bg-tuqang-error/10 border border-tuqang-error/50'
                  : 'bg-slate-800 border border-slate-700 dashed-border'}
            `}>
              
              {/* Status Icon */}
              <div className="mb-6">
                 {result.isValid ? (
                   <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                     <CheckCircle className="w-10 h-10 text-green-500" />
                   </div>
                 ) : result.perimeter !== null ? (
                   <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
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
                result.isValid ? 'text-green-400' : result.perimeter !== null ? 'text-red-400' : 'text-slate-500'
              }`}>
                {result.isValid ? 'GEOMETRI VALID' : result.perimeter !== null ? 'TIDAK PRESISI' : 'Menunggu Data'}
              </h3>
              
              <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
                {result.message}
              </p>

              {/* Perimeter Result */}
              {result.isValid && (
                <div className="w-full bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Total Keliling</p>
                  <p className="text-4xl font-mono font-bold text-white tracking-tighter">
                    {result.perimeter} <span className="text-lg text-tuqang-orange">unit</span>
                  </p>
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
