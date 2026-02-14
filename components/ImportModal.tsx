
import React, { useState, useRef } from 'react';
import { X, Upload, FileType, Check, AlertCircle, Info } from 'lucide-react';
import { Exercise, ExerciseType, CSVExerciseRow } from '../types';

interface ImportModalProps {
  onClose: () => void;
  onImport: (exercises: Exercise[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type === 'text/csv' || selected.name.endsWith('.csv')) {
        setFile(selected);
        setError(null);
      } else {
        setError('Please select a valid CSV file.');
        setFile(null);
      }
    }
  };

  const parseCSV = (content: string): Exercise[] => {
    const lines = content.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const nameIdx = headers.indexOf('Name');
    const descIdx = headers.indexOf('Description');
    const typeIdx = headers.indexOf('Type');

    if (nameIdx === -1 || typeIdx === -1) {
      throw new Error('CSV must contain "Name" and "Type" columns.');
    }

    const result: Exercise[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // Simple CSV split (not handling quoted commas for simplicity, but robust for basic requirements)
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const name = values[nameIdx];
      const desc = descIdx !== -1 ? values[descIdx] : '';
      const rawType = values[typeIdx];

      if (!name || !rawType) continue;

      // Mapping logic
      let type = ExerciseType.SETS_REPS;
      const t = rawType.toLowerCase();
      if (t.includes('sets & reps') || t.includes('sets and reps')) type = ExerciseType.SETS_REPS;
      else if (t.includes('sets & time') || t.includes('sets and time')) type = ExerciseType.SETS_TIME;
      else if (t.includes('time')) type = ExerciseType.TIME;

      result.push({
        id: crypto.randomUUID(),
        name,
        description: desc,
        type,
        videoPath: ''
      });
    }

    return result;
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const exercises = parseCSV(content);
          if (exercises.length === 0) {
            setError('No valid exercises found in CSV.');
          } else {
            onImport(exercises);
            onClose();
          }
        } catch (err: any) {
          setError(err.message || 'Failed to parse CSV.');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read file.');
        setIsProcessing(false);
      };
      reader.readAsText(file);
    } catch (err) {
      setError('An unexpected error occurred.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">Bulk Import</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          <div className="bg-indigo-50 rounded-2xl p-4 mb-6 flex gap-4 items-start border border-indigo-100">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-sm text-indigo-800 leading-relaxed">
              <p className="font-semibold mb-1">CSV Format Requirements:</p>
              <ul className="list-disc list-inside opacity-90">
                <li>Headers: <code className="bg-indigo-100 px-1 rounded">Name</code>, <code className="bg-indigo-100 px-1 rounded">Description</code>, <code className="bg-indigo-100 px-1 rounded">Type</code></li>
                <li>Duplicates based on Name will be skipped automatically.</li>
              </ul>
            </div>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all
              ${file ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".csv"
              className="hidden" 
            />
            
            {file ? (
              <div className="flex flex-col items-center text-center">
                <div className="bg-indigo-600 p-3 rounded-2xl mb-4 text-white">
                  <Check className="w-8 h-8" />
                </div>
                <p className="text-slate-900 font-bold">{file.name}</p>
                <p className="text-slate-500 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-4 text-xs font-semibold text-rose-600 hover:underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="bg-slate-100 p-4 rounded-2xl mb-4 text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <Upload className="w-10 h-10" />
                </div>
                <p className="text-slate-900 font-bold">Upload CSV File</p>
                <p className="text-slate-500 text-sm mt-1">Click to browse or drag and drop</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-rose-600 font-medium">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleProcess}
              disabled={!file || isProcessing}
              className={`
                flex-[2] py-3 px-4 text-sm font-semibold text-white rounded-xl shadow-lg transition-all
                ${!file || isProcessing ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-200'}
              `}
            >
              {isProcessing ? 'Processing...' : 'Import Exercises'}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};
