
import React, { useState, useRef } from 'react';
import { X, Upload, Check, AlertCircle, Info, Download, Calendar } from 'lucide-react';
import { ScheduledWorkout, WorkoutTemplate } from '../types';

interface Tier3ImportModalProps {
  templates: WorkoutTemplate[];
  onClose: () => void;
  onImport: (schedule: ScheduledWorkout[]) => void;
}

export const Tier3ImportModal: React.FC<Tier3ImportModalProps> = ({ templates, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (content: string): ScheduledWorkout[] => {
    const lines = content.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const hMap = {
      date: headers.indexOf('Date'),
      name: headers.indexOf('WorkoutName')
    };

    if (hMap.date === -1 || hMap.name === -1) {
      throw new Error('CSV must contain "Date" and "WorkoutName".');
    }

    const result: ScheduledWorkout[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const date = values[hMap.date];
      const wName = values[hMap.name];
      
      const template = templates.find(t => t.name.toLowerCase() === wName.toLowerCase());
      if (!template) continue; 

      result.push({ id: crypto.randomUUID(), date, templateId: template.id });
    }
    return result;
  };

  const handleProcess = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const schedule = parseCSV(e.target?.result as string);
        if (schedule.length === 0) throw new Error("No scheduled workouts found. Check dates or workout names.");
        onImport(schedule);
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
            <h3 className="text-xl font-black text-[#1A1A1A]">Schedule Planning</h3>
            <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest mt-1">Tier 3: The Schedule</p>
          </div>
          <button onClick={onClose} className="p-3 text-[#CCCCCC] hover:text-[#4A4A4A] rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh] no-scrollbar">
          <section className="space-y-4">
            <h4 className="text-[11px] font-black text-[#4A4A4A] uppercase tracking-[0.1em]">1. Date Format</h4>
            <div className="border border-[#EEEEEE] rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9F9F9] border-b border-[#EEEEEE]">
                    <th className="px-4 py-3 text-[10px] font-black text-[#AAAAAA] uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-[10px] font-black text-[#AAAAAA] uppercase tracking-wider">WorkoutName</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[11px] text-[#666666]">
                  <tr className="border-b border-[#F5F5F5]">
                    <td className="px-4 py-3">2024-03-20</td>
                    <td className="px-4 py-3">Upper Body Burn</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">2024-03-21</td>
                    <td className="px-4 py-3">Leg Day</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-2 p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-[#FF4500] shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-[#FF4500] leading-relaxed uppercase tracking-tight">
                  Format: <span className="font-black">YYYY-MM-DD</span>.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-[#FF4500] shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-[#FF4500] leading-relaxed uppercase tracking-tight">
                  <span className="font-black">WorkoutName</span> must exist in your Tier 2 Routines.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[11px] font-black text-[#4A4A4A] uppercase tracking-[0.1em]">2. Import Schedule</h4>
            
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
                  onClick={() => { /* Placeholder */ }}
                  className="flex items-center justify-center gap-2 py-4 border border-[#EEEEEE] rounded-2xl text-[10px] font-black text-[#AAAAAA] uppercase tracking-widest hover:bg-[#F9F9F9] transition-all"
                >
                  <Download className="w-4 h-4" /> Download Template
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 py-10 bg-[#FF4500] text-white rounded-[1.5rem] shadow-xl shadow-[#FF4500]/20 active:scale-[0.98] transition-all"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-xs font-black uppercase tracking-widest">Select Schedule CSV</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-[#F9F9F9] border border-[#FF4500]/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-black text-[#1A1A1A]">{file.name}</p>
                      <p className="text-[10px] font-bold text-[#AAAAAA] uppercase">Dates and names linked</p>
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
                  Apply Schedule Now
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
