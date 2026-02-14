
import React, { useState } from 'react';
import { X, Search, Check, Plus, Minus, Dumbbell, Timer } from 'lucide-react';
import { Exercise, ExerciseEntry, WorkoutTemplate, ExerciseType } from '../types';

interface WorkoutTemplateFormProps {
  exercises: Exercise[];
  onClose: () => void;
  onSubmit: (template: WorkoutTemplate) => void;
}

export const WorkoutTemplateForm: React.FC<WorkoutTemplateFormProps> = ({ exercises, onClose, onSubmit }) => {
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

    onSubmit({ id: crypto.randomUUID(), name, exercises: selectedEntries });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-[#F5F5F5] flex justify-between items-center bg-[#F9F9F9]">
          <div>
            <h3 className="text-xl font-black text-[#1A1A1A]">Create Workout Template</h3>
            <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest mt-1">Design a reusable workout routine</p>
          </div>
          <button onClick={onClose} className="p-3 text-[#CCCCCC] hover:text-[#4A4A4A] rounded-full transition-all active:scale-90"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div>
              <label className="block text-[10px] font-black text-[#AAAAAA] uppercase tracking-widest mb-2">Workout Name</label>
              <input 
                autoFocus 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. Upper Body Burn" 
                className="w-full px-5 py-4 bg-[#F9F9F9] border-none rounded-2xl font-black text-[#1A1A1A] outline-none placeholder:text-[#BBBBBB]" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#AAAAAA] uppercase tracking-widest mb-4">Add Exercises</label>
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" />
                <input 
                  type="text" 
                  placeholder="Filter library..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 bg-[#F9F9F9] border border-[#EEEEEE] rounded-xl text-sm outline-none" 
                />
              </div>
              <div className="grid gap-2 max-h-[350px] overflow-y-auto no-scrollbar pr-2">
                {filteredLibrary.map(ex => {
                  const isSelected = selectedEntries.some(e => e.exerciseId === ex.id);
                  return (
                    <button 
                      key={ex.id} 
                      onClick={() => toggleExercise(ex)} 
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isSelected ? 'bg-[#FF4500] border-[#FF4500] text-white shadow-lg' : 'bg-white border-[#EEEEEE] text-[#4A4A4A] hover:border-[#FF4500]/30'}`}
                    >
                      <span className="font-bold truncate pr-4">{ex.name}</span>
                      {isSelected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5 text-[#EEEEEE]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-[#F9F9F9] rounded-[2rem] p-6 flex flex-col">
            <h4 className="text-[10px] font-black text-[#AAAAAA] uppercase tracking-widest mb-6">Workout Preview</h4>
            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-2">
              {selectedEntries.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#DDDDDD] opacity-50">
                  <Dumbbell className="w-12 h-12 mb-2" />
                  <p className="font-bold text-xs uppercase">No Exercises Added</p>
                </div>
              ) : (
                selectedEntries.map((entry, idx) => {
                  const libEx = exercises.find(e => e.id === entry.exerciseId);
                  const isTimeType = libEx?.type === ExerciseType.TIME;
                  return (
                    <div key={entry.exerciseId} className="bg-white p-5 rounded-2xl border border-[#EEEEEE] animate-in slide-in-from-right-2">
                      <div className="flex justify-between items-start mb-4">
                        <h5 className="font-black text-[#1A1A1A] truncate flex-1 pr-4">{entry.exerciseName}</h5>
                        <button onClick={() => setSelectedEntries(prev => prev.filter((_, i) => i !== idx))} className="text-[#EEEEEE] hover:text-rose-500 transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {!isTimeType && (
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-black text-[#AAAAAA] uppercase">Sets</label>
                            <input 
                              type="number" 
                              min="1"
                              value={entry.sets} 
                              onChange={e => updateEntry(idx, 'sets', parseInt(e.target.value) || 1)} 
                              className="px-3 py-1 bg-[#F9F9F9] rounded text-xs font-black w-full outline-none focus:ring-1 focus:ring-[#FF4500]" 
                            />
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-black text-[#AAAAAA] uppercase">{isTimeType ? 'Duration' : 'Reps Target'}</label>
                          <input 
                            type="text" 
                            value={entry.reps > 0 ? entry.reps : entry.time} 
                            onChange={e => {
                              const val = e.target.value;
                              if (!isNaN(Number(val)) && val.trim() !== '') updateEntry(idx, 'reps', Number(val));
                              else updateEntry(idx, 'time', val);
                            }} 
                            className="px-3 py-1 bg-[#F9F9F9] rounded text-xs font-black w-full outline-none focus:ring-1 focus:ring-[#FF4500]" 
                          />
                        </div>
                        <div className="flex flex-col gap-1 col-span-2">
                          <label className="text-[8px] font-black text-[#AAAAAA] uppercase flex items-center gap-1"><Timer className="w-2 h-2" /> Rest Time (Seconds)</label>
                          <div className="flex items-center gap-3">
                            <input 
                              type="range" 
                              min="0" 
                              max="300" 
                              step="5"
                              value={entry.restTime} 
                              onChange={e => updateEntry(idx, 'restTime', parseInt(e.target.value))}
                              className="flex-1 accent-[#FF4500]"
                            />
                            <span className="text-[10px] font-black text-[#1A1A1A] w-8 text-right">{entry.restTime}s</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button type="button" onClick={() => updateEntry(idx, 'isSuperset', !entry.isSuperset)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${entry.isSuperset ? 'bg-[#FF4500] border-[#FF4500] text-white' : 'bg-white border-[#EEEEEE] text-[#AAAAAA] hover:border-[#FF4500]/20'}`}>Superset</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button 
              onClick={handleSubmit} 
              disabled={!name || selectedEntries.length === 0} 
              className="mt-8 w-full py-5 bg-[#FF4500] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#FF4500]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              Save Workout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
