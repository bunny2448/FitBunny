
import React, { useState, useMemo } from 'react';
import { Trash2, Rabbit, Plus, ClipboardList, CalendarDays } from 'lucide-react';
import { ScheduledWorkout, WorkoutTemplate } from '../types';

interface CalendarViewProps {
  schedule: ScheduledWorkout[];
  templates: WorkoutTemplate[];
  onOpenWorkout: (template: WorkoutTemplate) => void;
  onDeleteSchedule: (id: string) => void;
  onImportRequest: () => void;
  onManualAssignRequest: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  schedule, 
  templates, 
  onDeleteSchedule, 
  onOpenWorkout, 
  onImportRequest,
  onManualAssignRequest 
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const weekDays = useMemo(() => {
    const dates = [];
    for (let i = -3; i < 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  const assignedWorkouts = schedule.filter(s => s.date === selectedDate);
  const scheduledDates = new Set(schedule.map(s => s.date));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center gap-3 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
        {weekDays.map(date => {
          const d = new Date(date);
          const isSelected = selectedDate === date;
          const hasWorkout = scheduledDates.has(date);
          
          return (
            <button 
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`
                flex flex-col items-center justify-center min-w-[58px] py-4 rounded-[1.5rem] transition-all border
                ${isSelected ? 'bg-[#FF4500] border-[#FF4500] text-white shadow-lg shadow-[#FF4500]/20 scale-105' : 'bg-white border-[#EEEEEE] text-[#AAAAAA]'}
              `}
            >
              <span className={`text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 ${isSelected ? 'text-white/80' : 'text-[#BBBBBB]'}`}>
                {d.toLocaleDateString(undefined, { weekday: 'short' }).charAt(0)}
              </span>
              <span className="text-xl font-black leading-none">{d.getDate()}</span>
              {hasWorkout && (
                <div className={`mt-2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#FF4500]'}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[11px] font-black text-[#AAAAAA] uppercase tracking-[0.2em]">
            {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={onImportRequest}
              className="text-[10px] font-black text-[#AAAAAA] uppercase tracking-widest border border-[#EEEEEE] px-4 py-1.5 rounded-full hover:bg-[#F5F5F5] transition-all"
            >
              Bulk CSV
            </button>
            <button 
              onClick={onManualAssignRequest}
              className="text-[10px] font-black text-[#FF4500] uppercase tracking-widest border border-[#FF4500]/10 px-4 py-1.5 rounded-full hover:bg-[#FF4500]/5 transition-all"
            >
              + Assign Plan
            </button>
          </div>
        </div>
        
        {assignedWorkouts.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white border border-[#EEEEEE] rounded-[2rem]">
            <div className="w-12 h-12 bg-[#F9F9F9] rounded-2xl flex items-center justify-center text-[#DDDDDD] mb-4">
              <CalendarDays className="w-6 h-6" />
            </div>
            <p className="text-[#AAAAAA] font-bold text-sm">Nothing planned for today.</p>
            <button 
              onClick={onManualAssignRequest}
              className="mt-6 px-6 py-2.5 bg-[#FF4500] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#FF4500]/15 active:scale-95 transition-all"
            >
              Add Workout Plan
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {assignedWorkouts.map(sw => {
              const template = templates.find(t => t.id === sw.templateId);
              if (!template) return null;
              return (
                <div key={sw.id} className="bg-white border border-[#EEEEEE] rounded-[1.5rem] p-6 flex justify-between items-center group transition-all hover:border-[#FF4500]/20">
                  <div className="flex-1">
                    <h4 className="font-black text-lg text-[#1A1A1A] leading-tight">{template.name}</h4>
                    <p className="text-[#AAAAAA] text-[10px] font-black uppercase tracking-widest mt-1">{template.exercises.length} Exercises</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onDeleteSchedule(sw.id)} className="p-3 text-[#DDDDDD] hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                    <button onClick={() => onOpenWorkout(template)} className="bg-[#FF4500] text-white px-6 py-3 rounded-[1rem] font-black text-sm active:scale-95 shadow-lg shadow-[#FF4500]/15">Start</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
