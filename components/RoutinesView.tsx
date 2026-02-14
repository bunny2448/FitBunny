
import React, { useState } from 'react';
import { ChevronRight, Trash2, ChevronDown } from 'lucide-react';
import { WorkoutTemplate } from '../types';

interface RoutinesViewProps {
  workouts: WorkoutTemplate[];
  onDeleteRoutine: (name: string) => void;
  onCreateNew: () => void;
}

export const RoutinesView: React.FC<RoutinesViewProps> = ({ workouts, onDeleteRoutine, onCreateNew }) => {
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);

  const routines = Array.from(new Set(workouts.map(w => w.name))).map((name: string) => {
    const instances = workouts.filter(w => w.name === name);
    return {
      name,
      exercises: instances[0].exercises,
      count: instances.length
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[11px] font-black text-[#AAAAAA] uppercase tracking-[0.25em]">Templates</h2>
        <button 
          onClick={onCreateNew}
          className="text-[10px] font-black text-[#FF4500] uppercase tracking-widest border border-[#FF4500]/10 px-4 py-1.5 rounded-full hover:bg-[#FF4500]/5"
        >
          + New Routine
        </button>
      </div>

      {routines.length === 0 ? (
        <div className="py-24 text-center bg-white border border-[#EEEEEE] rounded-[2rem]">
          <p className="text-[#AAAAAA] font-bold">No routines created yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {routines.map((routine) => (
            <div 
              key={routine.name} 
              className={`bg-white border rounded-[2rem] overflow-hidden transition-all ${expandedRoutine === routine.name ? 'border-[#FF4500]/20 shadow-xl shadow-[#FF4500]/5' : 'border-[#EEEEEE]'}`}
            >
              <button 
                onClick={() => setExpandedRoutine(expandedRoutine === routine.name ? null : routine.name)}
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <div className="flex-1">
                  <h4 className="text-lg font-black text-[#1A1A1A] leading-tight">{routine.name}</h4>
                  <p className="text-[10px] font-black text-[#AAAAAA] uppercase tracking-widest mt-1">
                    {routine.exercises.length} Exercises • {routine.count} Logged
                  </p>
                </div>
                <div className={`${expandedRoutine === routine.name ? 'text-[#FF4500]' : 'text-[#CCCCCC]'}`}>
                  {expandedRoutine === routine.name ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </button>

              {expandedRoutine === routine.name && (
                <div className="px-6 pb-6 pt-2 space-y-5 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    {routine.exercises.map((entry, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-bold text-[#666666] bg-[#F9F9F9] p-4 rounded-2xl">
                        <span>{entry.exerciseName}</span>
                        <span className="text-[#AAAAAA]">{entry.sets}×{entry.reps || entry.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-3 border-t border-[#F5F5F5]">
                    <button 
                      onClick={() => onDeleteRoutine(routine.name)}
                      className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 py-2 px-4 hover:bg-rose-50 rounded-xl"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
