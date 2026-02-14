
import React, { useState, useRef } from 'react';
import { X, Upload, Check, AlertCircle, Info, Database } from 'lucide-react';
import { Exercise, ExerciseEntry } from '../types';

// Define local Workout interface since it is specific to this legacy import component's denormalized structure
interface Workout {
  id: string;
  dateScheduled: string;
  workoutName: string;
  exercises: ExerciseEntry[];
}

interface WorkoutImportModalProps {
  library: Exercise[];
  onClose: () => void;
  onImport: (workouts: Workout[], missing: string[]) => void;
}

export const WorkoutImportModal: React.FC<WorkoutImportModalProps> = ({ library, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (content: string): { workouts: Workout[], missing: string[] } => {
    const lines = content.split(/\r?\n/);
    if (lines.length < 2) throw new Error('Empty CSV');

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const hMap = {
      date: headers.indexOf('Date'),
      wName: headers.indexOf('WorkoutName'),
      eName: headers.indexOf('ExerciseName'),
      sets: headers.indexOf('Sets'),
      reps: headers.indexOf('Reps'),
      time: headers.indexOf('Time'),
      repeat: headers.indexOf('isRepeat'),
      super: headers.indexOf('isSuperset'),
      // Add RestTime mapping
      rest: headers.indexOf('RestTime')
    };

    if (hMap.date === -1 || hMap.wName === -1 || hMap.eName === -1) {
      throw new Error('CSV must contain Date, WorkoutName, and ExerciseName columns.');
    }

    const workoutsMap: Record<string, Workout> = {};
    const missingExercises = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const dateStr = values[hMap.date];
      const workoutName = values[hMap.wName];
      const exerciseName = values[hMap.eName];
      
      const libraryExercise = library.find(e => e.name.toLowerCase() === exerciseName.toLowerCase());
      
      if (!libraryExercise) {
        missingExercises.add(exerciseName);
        continue;
      }

      const key = `${dateStr}_${workoutName}`;
      if (!workoutsMap[key]) {
        workoutsMap[key] = {
          id: crypto.randomUUID(),
          dateScheduled: dateStr,
          workoutName,
          exercises: []
        };
      }

      // Fix: Added missing restTime property to ExerciseEntry object
      workoutsMap[key].exercises.push({
        exerciseId: libraryExercise.id,
        exerciseName: libraryExercise.name,
        sets: parseInt(values[hMap.sets]) || 0,
        reps: parseInt(values[hMap.reps]) || 0,
        time: values[hMap.time] || '',
        restTime: hMap.rest !== -1 ? (parseInt(values[hMap.rest]) || 60) : 60,
        isRepeat: values[hMap.repeat]?.toLowerCase() === 'true',
        isSuperset: values[hMap.super]?.toLowerCase() === 'true'
      });
    }

    return { 
      workouts: Object.values(workoutsMap), 
      missing: Array.from(missingExercises) 
    };
  };

  const handleProcess = () => {
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { workouts, missing } = parseCSV(e.target?.result as string);
        onImport(workouts, missing);
        onClose();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">Import Workouts</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-8">
          <div className="bg-amber-50 rounded-2xl p-4 mb-6 border border-amber-100 flex gap-4">
            <Database className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-bold mb-1">Library Sync Required</p>
              <p className="opacity-80">Rows with Exercise names not found in your current Library will be skipped.</p>
            </div>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center cursor-pointer transition-all ${file ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 hover:bg-slate-50'}`}
          >
            <input type="file" ref={fileInputRef} onChange={e => setFile(e.target.files?.[0] || null)} accept=".csv" className="hidden" />
            {file ? (
              <div className="text-center">
                <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold">{file.name}</p>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold">Select Workout CSV</p>
                <p className="text-sm text-slate-400">Date, WorkoutName, ExerciseName...</p>
              </div>
            )}
          </div>

          {error && <div className="mt-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium flex gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

          <div className="mt-8 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 font-semibold text-slate-600">Cancel</button>
            <button onClick={handleProcess} disabled={!file || isProcessing} className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg disabled:bg-slate-200">
              {isProcessing ? 'Processing...' : 'Import Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
