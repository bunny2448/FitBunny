
import React, { useState, useRef } from 'react';
import { X, Upload, Check, AlertCircle, Info, Download } from 'lucide-react';
import { Exercise, WorkoutTemplate } from '../types';

interface Tier2ImportModalProps {
  exercises: Exercise[];
  onClose: () => void;
  onImport: (templates: WorkoutTemplate[]) => void;
}

export const Tier2ImportModal: React.FC<Tier2ImportModalProps> = ({ exercises, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (content: string): WorkoutTemplate[] => {
    const lines = content.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const hMap = {
      wName: headers.indexOf('WorkoutName'),
      eName: headers.indexOf('ExerciseName'),
      sets: headers.indexOf('Sets'),
      reps: headers.indexOf('Reps'),
      time: headers.indexOf('Time'),
      rest: headers.indexOf('RestTime'),
      repeat: headers.indexOf('isRepeat'),
      super: headers.indexOf('isSuperset')
    };

    if (hMap.wName === -1 || hMap.eName === -1) {
      throw new Error('CSV must contain "WorkoutName" and "ExerciseName".');
    }

    const templatesMap: Record<string, WorkoutTemplate> = {};
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const wName = values[hMap.wName];
      const eName = values[hMap.eName];
      
      const libEx = exercises.find(ex => ex.name.toLowerCase() === eName.toLowerCase());
      if (!libEx) continue; 

      if (!templatesMap[wName]) {
        templatesMap[wName] = { id: crypto.randomUUID(), name: wName, exercises: [] };
      }

      templatesMap[wName].exercises.push({
        exerciseId: libEx.id,
        exerciseName: libEx.name,
        sets: parseInt(values[hMap.sets]) || 3,
        reps: parseInt(values[hMap.reps]) || 0,
        time: values[hMap.time] || '',
        restTime: parseInt(values[hMap.rest]) || 60,
        isRepeat: values[hMap.repeat]?.toLowerCase() === 'true',
        isSuperset: values[hMap.super]?.toLowerCase() === 'true'
      });
    }
    return Object.values(templatesMap);
  };

  const handleProcess = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const templates = parseCSV(e.target?.result as string);
        if (templates.length === 0) throw new Error("No valid workouts found. Check exercise names.");
        onImport(templates);
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
            <h3 className="text-xl font-black text-[#1A1A1A]">Import Workouts</h3>
            <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest mt-1">Tier 2: The Routines</p>
          </div>
          <button onClick={onClose} className="p-3 text-[#CCCCCC] hover:text-[#4A4A4A] rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh] no-scrollbar">
          <section className="space-y-4">
            <h4 className="text-[11px] font-black text-[#4A4A4A] uppercase tracking-[0.1em]">1. CSV Structure</h4>
            <div className="border border-[#EEEEEE] rounded-2xl overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-[#F9F9F9] border-b border-[#EEEEEE]">
                    <th className="px-4 py-3 text-[9px] font-black text-[#AAAAAA] uppercase tracking-wider">WorkoutName</th>
                    <th className="px-4 py-3 text-[9px] font-black text-[#AAAAAA] uppercase tracking-wider">ExerciseName</th>
                    <th className="px-4 py-3 text-[9px] font-black text-[#AAAAAA] uppercase tracking-wider">Sets</th>
                    <th className="px-4 py-3 text-[9px] font-black text-[#AAAAAA] uppercase tracking-wider">Reps</th>
                    <th className="px-4 py-3 text-[9px] font-black text-[#AAAAAA] uppercase tracking-wider">RestTime</th>
                    <th className="px-4 py-3 text-[9px] font-black text-[#AAAAAA] uppercase tracking-wider">Super</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[10px] text-[#666666]">
                  <tr className="border-b border-[#F5F5F5]">
                    <td className="px-4 py-3">Upper Body</td>
                    <td className="px-4 py-3">Pushups</td>
                    <td className="px-4 py-3">3</td>
                    <td className="px-4 py-3">15</td>
                    <td className="px-4 py-3">60</td>
                    <td className="px-4 py-3">FALSE</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
              <Info className="w-4 h-4 text-[#FF4500] shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-[#FF4500] leading-relaxed uppercase tracking-tight">
                Include a <span className="font-black">RestTime</span> column for per-exercise recovery timers (in seconds).
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[11px] font-black text-[#4A4A4A] uppercase tracking-[0.1em]">2. Upload file</h4>
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
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-3 py-10 bg-[#FF4500] text-white rounded-[1.5rem] shadow-xl shadow-[#FF4500]/20 transition-all"
              >
                <Upload className="w-6 h-6" />
                <span className="text-xs font-black uppercase tracking-widest">Select CSV</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-[#F9F9F9] border border-[#FF4500]/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <p className="text-sm font-black text-[#1A1A1A]">{file.name}</p>
                  </div>
                  <button onClick={() => setFile(null)} className="text-[10px] font-black text-rose-500 uppercase">Change</button>
                </div>
                <button 
                  onClick={handleProcess}
                  className="w-full py-5 bg-[#FF4500] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#FF4500]/20 transition-all"
                >
                  Confirm Import
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
