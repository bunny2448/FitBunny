
import React, { useState } from 'react';
import { ChevronRight, Trash2, ChevronDown } from 'lucide-react';
import { WorkoutTemplate } from '../types';

interface WorkoutTemplatesViewProps {
  templates: WorkoutTemplate[];
  onDeleteTemplate: (id: string) => void;
  onCreateNew: () => void;
}

export const WorkoutTemplatesView: React.FC<WorkoutTemplatesViewProps> = ({ templates, onDeleteTemplate, onCreateNew }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (templates.length === 0) {
    return (
      <div className="py-24 text-center bg-white border border-[#EEEEEE] rounded-[2rem]">
        <p className="text-[#AAAAAA] font-bold">No workout routines created.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {templates.map((template) => (
        <div 
          key={template.id} 
          className={`bg-white border rounded-[2rem] overflow-hidden transition-all ${expandedId === template.id ? 'border-[#FF4500]/20 shadow-xl shadow-[#FF4500]/5' : 'border-[#EEEEEE]'}`}
        >
          <button 
            onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
            className="w-full p-6 flex items-center justify-between text-left"
          >
            <div className="flex-1">
              <h4 className="text-lg font-black text-[#1A1A1A] leading-tight">{template.name}</h4>
              <p className="text-[10px] font-black text-[#AAAAAA] uppercase tracking-widest mt-1">
                {template.exercises.length} Exercises in this Workout
              </p>
            </div>
            <div className={`${expandedId === template.id ? 'text-[#FF4500]' : 'text-[#CCCCCC]'}`}>
              {expandedId === template.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </button>

          {expandedId === template.id && (
            <div className="px-6 pb-6 pt-2 space-y-5 animate-in slide-in-from-top-2">
              <div className="space-y-2">
                {template.exercises.map((entry, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold text-[#666666] bg-[#F9F9F9] p-4 rounded-2xl">
                    <span>{entry.exerciseName}</span>
                    <span className="text-[#AAAAAA]">{entry.sets}×{entry.reps || entry.time}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-3 border-t border-[#F5F5F5]">
                <button 
                  onClick={() => onDeleteTemplate(template.id)}
                  className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 py-2 px-4 hover:bg-rose-50 rounded-xl"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Workout
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
