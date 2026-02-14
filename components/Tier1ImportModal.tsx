
import React, { useState, useRef } from 'react';
import { X, Upload, Check, AlertCircle, Info, Download, BookOpen } from 'lucide-react';
import { Exercise, ExerciseType } from '../types';

interface Tier1ImportModalProps {
  onClose: () => void;
  onImport: (exercises: Exercise[]) => void;
}

export const Tier1ImportModal: React.FC<Tier1ImportModalProps> = ({ onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (content: string): Exercise[] => {
    const lines = content.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const hMap = {
      name: headers.indexOf('Name'),
      desc: headers.indexOf('Description'),
      type: headers.indexOf('Type')
    };

    if (hMap.name === -1 || hMap.type === -1) {
      throw new Error('CSV must contain "Name" and "Type" columns.');
    }

    const result: Exercise[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const name = values[hMap.name];
      const desc = hMap.desc !== -1 ? values[hMap.desc] : '';
      const rawType = values[hMap.type];

      if (!name || !rawType) continue;

      let type = ExerciseType.SETS_REPS;
      const t = rawType.toLowerCase();
      if (t.includes('sets & time') || t.includes('sets and time')) type = ExerciseType.SETS_TIME;
      else if (t.includes('time')) type = ExerciseType.TIME;
      else type = ExerciseType.SETS_REPS;

      result.push({ id: crypto.randomUUID(), name, description: desc, type });
    }
    return result;
  };

  const handleProcess = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const exs = parseCSV(e.target?.result as string);
        if (exs.length === 0) throw new Error("No exercises found in file.");
        onImport(exs);
      } catch (err: any) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in scale-in duration-300">
        <div className="px-8 py-6 border-b border-[#F5F5F5] flex justify-between items-center bg-[#F9F9F9]">
          <div>
            <h3 className="text-xl font-black text-[#1A1A1A]">Import Exercises</h3>
            <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest mt-1">Tier 1: The Ingredients</p>
          </div>
          <button onClick={onClose} className="p-3 text-[#CCCCCC] hover:text-[#4A4A4A] rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh] no-scrollbar">
          {/* Column Dictionary Section */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black text-[#4A4A4A] uppercase tracking-[0.1em] flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-[#FF4500]" />
              Accepted Column Values
            </h4>
            <div className="grid gap-3">
              <div className="p-4 bg-[#F9F9F9] rounded-2xl border border-[#EEEEEE]">
                <p className="text-[10px] font-black text-[#FF4500] uppercase mb-1">Column: Name</p>
                <p className="text-xs font-semibold text-[#4A4A4A]">Required. Any text string (e.g., "Barbell Squat"). Used to identify and prevent duplicates.</p>
              </div>
              <div className="p-4 bg-[#F9F9F9] rounded-2xl border border-[#EEEEEE]">
                <p className="text-[10px] font-black text-[#FF4500] uppercase mb-1">Column: Description</p>
                <p className="text-xs font-semibold text-[#4A4A4A]">Optional. Instructions or form cues for the exercise.</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border-2 border-[#FF4500]/10 shadow-sm">
                <p className="text-[10px] font-black text-[#FF4500] uppercase mb-1">Column: Type</p>
                <p className="text-xs font-semibold text-[#4A4A4A] mb-2">Required. Must be exactly one of the following:</p>
                <div className="flex flex-wrap gap-2">
                  {["Sets & Reps", "Time", "Sets & Time"].map(t => (
                    <span key={t} className="px-2 py-1 bg-[#FF4500] text-white rounded-lg text-[9px] font-black uppercase">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[11px] font-black text-[#4A4A4A] uppercase tracking-[0.1em]">1. Format Preview</h4>
            <div className="border border-[#EEEEEE] rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9F9F9] border-b border-[#EEEEEE]">
                    <th className="px-4 py-3 text-[10px] font-black text-[#AAAAAA] uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-[10px] font-black text-[#AAAAAA] uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-[10px] font-black text-[#AAAAAA] uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[11px] text-[#666666]">
                  <tr className="border-b border-[#F5F5F5]">
                    <td className="px-4 py-3">Pushups</td>
                    <td className="px-4 py-3">Hands shoulder width...</td>
                    <td className="px-4 py-3 font-bold text-[#FF4500]">Sets & Reps</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Plank</td>
                    <td className="px-4 py-3">Hold straight line...</td>
                    <td className="px-4 py-3 font-bold text-[#FF4500]">Time</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[11px] font-black text-[#4A4A4A] uppercase tracking-[0.1em]">2. Upload your file</h4>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={e => {
                setFile(e.target.files?.[0] || null);
                setError(null);
              }} 
              accept=".csv" 
              className="hidden" 
            />

            {!file ? (
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 py-10 bg-[#FF4500] text-white rounded-[1.5rem] shadow-xl shadow-[#FF4500]/20 active:scale-[0.98] transition-all"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-xs font-black uppercase tracking-widest">Select CSV File</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-[#F9F9F9] border border-[#FF4500]/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-black text-[#1A1A1A]">{file.name}</p>
                      <p className="text-[10px] font-bold text-[#AAAAAA] uppercase">Ready to process</p>
                    </div>
                  </div>
                  <button onClick={() => setFile(null)} className="text-[10px] font-black text-rose-500 uppercase">Change</button>
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-500 rounded-xl border border-rose-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-[10px] font-black uppercase">{error}</span>
                  </div>
                )}
                <button 
                  onClick={handleProcess}
                  className="w-full py-5 bg-[#FF4500] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#FF4500]/20 transition-all"
                >
                  Import Exercises Now
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
