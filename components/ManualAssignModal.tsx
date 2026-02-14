
import React, { useState } from 'react';
import { X, Calendar, Check, Search, List } from 'lucide-react';
import { WorkoutTemplate, ScheduledWorkout } from '../types';

interface ManualAssignModalProps {
  templates: WorkoutTemplate[];
  onClose: () => void;
  onAssign: (entry: ScheduledWorkout) => void;
}

export const ManualAssignModal: React.FC<ManualAssignModalProps> = ({ templates, onClose, onAssign }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = () => {
    if (!selectedTemplateId) return;
    onAssign({
      id: crypto.randomUUID(),
      date: selectedDate,
      templateId: selectedTemplateId
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in scale-in duration-300">
        <div className="px-8 py-6 border-b border-[#F5F5F5] flex justify-between items-center bg-[#F9F9F9]">
          <div>
            <h3 className="text-xl font-black text-[#1A1A1A]">Assign Workout</h3>
            <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest mt-1">Manual Schedule Entry</p>
          </div>
          <button onClick={onClose} className="p-3 text-[#CCCCCC] hover:text-[#4A4A4A] rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh] no-scrollbar">
          {/* Date Picker */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black text-[#4A4A4A] uppercase tracking-[0.1em] flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#FF4500]" />
              1. Choose Date
            </h4>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-5 py-4 bg-[#F9F9F9] border border-[#EEEEEE] rounded-2xl focus:border-[#FF4500] outline-none transition-all font-black text-[#1A1A1A]"
            />
          </section>

          {/* Template Selection */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black text-[#4A4A4A] uppercase tracking-[0.1em] flex items-center gap-2">
              <List className="w-3.5 h-3.5 text-[#FF4500]" />
              2. Select Routine
            </h4>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" />
              <input 
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-[#EEEEEE] rounded-xl text-sm outline-none focus:border-[#FF4500]/50 transition-colors"
              />
            </div>

            <div className="grid gap-2 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
              {filteredTemplates.length === 0 ? (
                <div className="py-10 text-center bg-[#F9F9F9] rounded-2xl border border-dashed border-[#EEEEEE]">
                  <p className="text-[10px] font-black text-[#AAAAAA] uppercase tracking-widest">No matching routines</p>
                </div>
              ) : (
                filteredTemplates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`
                      w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left
                      ${selectedTemplateId === t.id 
                        ? 'bg-[#FF4500] border-[#FF4500] text-white shadow-lg' 
                        : 'bg-white border-[#EEEEEE] text-[#4A4A4A] hover:border-[#FF4500]/20'}
                    `}
                  >
                    <div>
                      <h5 className="font-bold text-sm leading-tight">{t.name}</h5>
                      <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${selectedTemplateId === t.id ? 'text-white/70' : 'text-[#AAAAAA]'}`}>
                        {t.exercises.length} Exercises
                      </p>
                    </div>
                    {selectedTemplateId === t.id && <Check className="w-5 h-5" />}
                  </button>
                ))
              )}
            </div>
          </section>

          <button 
            onClick={handleAssign}
            disabled={!selectedTemplateId}
            className="w-full py-5 bg-[#FF4500] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#FF4500]/20 transition-all disabled:opacity-30 disabled:grayscale"
          >
            Assign to Calendar
          </button>
        </div>
      </div>
    </div>
  );
};
