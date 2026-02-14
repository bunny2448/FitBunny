
import React, { useState } from 'react';
import { X, Search, Check, Plus, Minus, Layers, Timer, Activity, Dumbbell } from 'lucide-react';
import { Exercise, ExerciseEntry, WorkoutTemplate, ExerciseType } from '../types';

interface RoutineFormProps {
  exercises: Exercise[];
  onClose: () => void;
  onSubmit: (workout: WorkoutTemplate) => void;
}

export const RoutineForm: React.FC<RoutineFormProps> = ({ exercises, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [selectedEntries, setSelectedEntries] = useState<ExerciseEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLibrary = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExercise = (ex: Exercise) => {
    const existingIdx = selectedEntries.findIndex(e => e.exerciseId === ex.id);
    if (existingIdx >= 0) {
      setSelectedEntries(prev => prev.filter((_, i) => i !== existingIdx));
    } else {
      // Fix: Add missing restTime property to satisfy ExerciseEntry interface
      setSelectedEntries(prev => [...prev, {
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: 3,
        reps: ex.type === ExerciseType.TIME ? 0 : 10,
        time: ex.type === ExerciseType.TIME ? '30s' : '',
        restTime: 60,
        isRepeat: false,
        isSuperset: false
      }]);
    }
  };

  const updateEntry = (idx: number, field: keyof ExerciseEntry, value: any) => {
    setSelectedEntries(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedEntries.length === 0) return;

    const workout: WorkoutTemplate = {
      id: crypto.randomUUID(),
      name: name,
      exercises: selectedEntries
    };

    onSubmit(workout);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-scale-up">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Create Workout</h3>
            <p className="text-slate-500 text-sm font-medium">Group your favorite exercises into a routine.</p>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Side: Setup & Selection */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Workout Name</label>
                <input 
                  autoFocus
                  type="text"
                  required
                  placeholder="e.g. Morning Push Routine"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-100 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Add Exercises</label>
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Filter library..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredLibrary.map(ex => {
                  const isSelected = selectedEntries.some(e => e.exerciseId === ex.id);
                  return (
                    <button
                      key={ex.id}
                      onClick={() => toggleExercise(ex)}
                      className={`
                        flex items-center justify-between p-4 rounded-2xl border transition-all text-left
                        ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 hover:border-indigo-200 text-slate-700'}
                      `}
                    >
                      <span className="font-bold truncate pr-4">{ex.name}</span>
                      {isSelected ? <Check className="w-5 h-5 shrink-0" /> : <Plus className="w-5 h-5 shrink-0 text-slate-300" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side: Configuration */}
          <div className="bg-slate-50 rounded-[2rem] p-6 flex flex-col">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-between">
              Routine Preview
              <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black">{selectedEntries.length} Items</span>
            </h4>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {selectedEntries.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <Dumbbell className="w-12 h-12 mb-2 opacity-20" />
                  <p className="font-bold text-sm">Select exercises to start</p>
                </div>
              ) : (
                selectedEntries.map((entry, idx) => (
                  <div key={entry.exerciseId} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 animate-fade-in">
                    <div className="flex justify-between items-start mb-4">
                      <h5 className="font-black text-slate-900 truncate flex-1 pr-4">{entry.exerciseName}</h5>
                      <button onClick={() => setSelectedEntries(prev => prev.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-10 font-black text-slate-400 uppercase">Sets</label>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => updateEntry(idx, 'sets', Math.max(1, entry.sets - 1))} className="p-1 bg-slate-100 rounded-md"><Minus className="w-3 h-3" /></button>
                          <span className="font-bold w-6 text-center">{entry.sets}</span>
                          <button type="button" onClick={() => updateEntry(idx, 'sets', entry.sets + 1)} className="p-1 bg-slate-100 rounded-md"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-10 font-black text-slate-400 uppercase">Reps / Time</label>
                        <input 
                          type="text"
                          value={entry.reps > 0 ? entry.reps : entry.time}
                          onChange={e => {
                            const val = e.target.value;
                            if (!isNaN(Number(val))) updateEntry(idx, 'reps', Number(val));
                            else updateEntry(idx, 'time', val);
                          }}
                          className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-bold w-full outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3 border-t border-slate-50 pt-3">
                      <button 
                        type="button"
                        onClick={() => updateEntry(idx, 'isSuperset', !entry.isSuperset)}
                        className={`flex-1 py-1.5 rounded-lg text-10 font-black uppercase tracking-wider transition-all border ${entry.isSuperset ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
                      >
                        Superset
                      </button>
                      <button 
                        type="button"
                        onClick={() => updateEntry(idx, 'isRepeat', !entry.isRepeat)}
                        className={`flex-1 py-1.5 rounded-lg text-10 font-black uppercase tracking-wider transition-all border ${entry.isRepeat ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
                      >
                        Repeat
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={!name || selectedEntries.length === 0}
              className="mt-8 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.98]"
            >
              Save Workout Routine
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};
