
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Trash2, Rabbit, Calendar as CalendarIcon, CheckCircle2, List, History as HistoryIcon, Dumbbell } from 'lucide-react';
import { Exercise, WorkoutTemplate, ScheduledWorkout, WorkoutLog } from './types';
import { ExercisesView } from './components/ExercisesView';
import { Tier1ImportModal } from './components/Tier1ImportModal';
import { ExerciseForm } from './components/ExerciseForm';
import { CalendarView } from './components/CalendarView';
import { Tier2ImportModal } from './components/Tier2ImportModal';
import { Tier3ImportModal } from './components/Tier3ImportModal';
import { ManualAssignModal } from './components/ManualAssignModal';
import { ActiveWorkoutScreen } from './components/ActiveWorkoutScreen';
import { WorkoutTemplatesView } from './components/WorkoutTemplatesView';
import { WorkoutTemplateForm } from './components/WorkoutTemplateForm';
import { HistoryView } from './components/HistoryView';
import { videoDb } from './utils/videoDb';

const STORAGE_KEYS = {
  EXERCISES: 'fitbunny_v2_exercises',
  TEMPLATES: 'fitbunny_v2_templates',
  SCHEDULE: 'fitbunny_v2_schedule',
  LOGS: 'fitbunny_v2_logs'
};

type Tab = 'exercises' | 'workouts' | 'calendar' | 'history';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [schedule, setSchedule] = useState<ScheduledWorkout[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isTier1ImportOpen, setIsTier1ImportOpen] = useState(false);
  const [isTier2ImportOpen, setIsTier2ImportOpen] = useState(false);
  const [isTier3ImportOpen, setIsTier3ImportOpen] = useState(false);
  const [isManualAssignOpen, setIsManualAssignOpen] = useState(false);
  const [isAddExModalOpen, setIsAddExModalOpen] = useState(false);
  const [isAddTemplateModalOpen, setIsAddTemplateModalOpen] = useState(false);
  
  const [activeWorkout, setActiveWorkout] = useState<WorkoutTemplate | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'warning' } | null>(null);

  useEffect(() => {
    const savedEx = localStorage.getItem(STORAGE_KEYS.EXERCISES);
    const savedTemplates = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    const savedSchedule = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    
    if (savedEx) setExercises(JSON.parse(savedEx));
    if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
    if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
    if (savedLogs) setWorkoutLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises)), [exercises]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates)), [templates]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule)), [schedule]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(workoutLogs)), [workoutLogs]);

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => 
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.description.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, searchTerm]);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Tier 1 Handlers
  const handleAddExercise = (newEx: Exercise) => {
    setExercises(prev => [...prev, newEx]);
    showNotification(`Added ${newEx.name}`, 'success');
    return true;
  };

  const handleDeleteExercise = async (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
    await videoDb.deleteVideo(id);
    showNotification('Exercise removed.', 'success');
  };

  // Tier 2 Handlers
  const handleAddTemplate = (template: WorkoutTemplate) => {
    setTemplates(prev => [...prev, template]);
    showNotification(`Routine "${template.name}" created.`, 'success');
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    setSchedule(prev => prev.filter(s => s.templateId !== id));
    showNotification('Template deleted.', 'success');
  };

  // Tier 3 Handlers
  const handleAddSchedule = (entry: ScheduledWorkout) => {
    setSchedule(prev => [...prev, entry]);
    showNotification('Workout scheduled.', 'success');
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedule(prev => prev.filter(s => s.id !== id));
    showNotification('Schedule cleared.', 'success');
  };

  const handleWorkoutComplete = (log: WorkoutLog) => {
    setWorkoutLogs(prev => [...prev, log]);
    setActiveWorkout(null);
    showNotification('Workout logged!', 'success');
  };

  if (activeWorkout) {
    return (
      <ActiveWorkoutScreen 
        template={activeWorkout} 
        library={exercises}
        onBack={() => setActiveWorkout(null)} 
        onComplete={handleWorkoutComplete}
        previousLogs={workoutLogs}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#4A4A4A] pb-28 font-rounded tracking-tight">
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#EEEEEE]">
        <div className="max-w-2xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#FF4500] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#FF4500]/20">
              <Rabbit className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-[#1A1A1A]">FitBunny</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {activeTab === 'exercises' && (
              <button onClick={() => setIsAddExModalOpen(true)} className="w-10 h-10 bg-[#FF4500] rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-transform">
                <Plus className="w-6 h-6" />
              </button>
            )}
            {activeTab === 'workouts' && (
              <button onClick={() => setIsAddTemplateModalOpen(true)} className="w-10 h-10 bg-[#FF4500] rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-transform">
                <Plus className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 pt-6 animate-in fade-in duration-500">
        {activeTab === 'exercises' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="relative flex-1 group mr-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA] group-focus-within:text-[#FF4500] transition-colors" />
                <input 
                  type="text"
                  placeholder="Filter exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-white border border-[#EEEEEE] rounded-[1.5rem] focus:border-[#FF4500] outline-none transition-all placeholder:text-[#BBBBBB] text-sm font-medium"
                />
              </div>
              <button 
                onClick={() => setIsTier1ImportOpen(true)}
                className="text-[10px] font-black text-[#FF4500] uppercase tracking-widest border border-[#FF4500]/10 px-4 py-2 rounded-full hover:bg-[#FF4500]/5"
              >
                CSV Import
              </button>
            </div>
            <ExercisesView exercises={filteredExercises} onDelete={handleDeleteExercise} totalCount={exercises.length} />
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-[11px] font-black text-[#AAAAAA] uppercase tracking-[0.25em]">My Routines</h2>
              <button 
                onClick={() => setIsTier2ImportOpen(true)}
                className="text-[10px] font-black text-[#FF4500] uppercase tracking-widest border border-[#FF4500]/10 px-4 py-1.5 rounded-full hover:bg-[#FF4500]/5"
              >
                CSV Import
              </button>
            </div>
            <WorkoutTemplatesView templates={templates} onDeleteTemplate={handleDeleteTemplate} onCreateNew={() => setIsAddTemplateModalOpen(true)} />
          </div>
        )}

        {activeTab === 'calendar' && (
          <CalendarView 
            schedule={schedule} 
            templates={templates}
            onOpenWorkout={(t) => setActiveWorkout(t)} 
            onDeleteSchedule={handleDeleteSchedule}
            onImportRequest={() => setIsTier3ImportOpen(true)}
            onManualAssignRequest={() => setIsManualAssignOpen(true)}
          />
        )}

        {activeTab === 'history' && <HistoryView logs={workoutLogs} />}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[#EEEEEE] px-8 pb-8 pt-3 z-20">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          {[
            { id: 'exercises', icon: Dumbbell, label: 'Exercises' },
            { id: 'workouts', icon: List, label: 'Workouts' },
            { id: 'calendar', icon: CalendarIcon, label: 'Calendar' },
            { id: 'history', icon: HistoryIcon, label: 'History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-[#FF4500]' : 'text-[#AAAAAA] hover:text-[#777777]'}`}
            >
              <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.1em]">{tab.label}</span>
            </button>
          ))}
        </div>
      </footer>

      {/* Modals */}
      {isTier1ImportOpen && <Tier1ImportModal onClose={() => setIsTier1ImportOpen(false)} onImport={(exs) => { exs.forEach(handleAddExercise); setIsTier1ImportOpen(false); }} />}
      {isTier2ImportOpen && <Tier2ImportModal exercises={exercises} onClose={() => setIsTier2ImportOpen(false)} onImport={(ts) => { ts.forEach(handleAddTemplate); setIsTier2ImportOpen(false); }} />}
      {isTier3ImportOpen && <Tier3ImportModal templates={templates} onClose={() => setIsTier3ImportOpen(false)} onImport={(schs) => { schs.forEach(handleAddSchedule); setIsTier3ImportOpen(false); }} />}
      {isManualAssignOpen && <ManualAssignModal templates={templates} onClose={() => setIsManualAssignOpen(false)} onAssign={handleAddSchedule} />}
      {isAddExModalOpen && <ExerciseForm onClose={() => setIsAddExModalOpen(false)} onSubmit={handleAddExercise} />}
      {isAddTemplateModalOpen && <WorkoutTemplateForm exercises={exercises} onClose={() => setIsAddTemplateModalOpen(false)} onSubmit={handleAddTemplate} />}

      {notification && (
        <div className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-full shadow-xl animate-in slide-in-from-bottom-4 duration-300 text-sm font-bold border ${
          notification.type === 'success' ? 'bg-[#FF4500] text-white border-transparent' : 'bg-white text-rose-500 border-rose-100'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default App;
