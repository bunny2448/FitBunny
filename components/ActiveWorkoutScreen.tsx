
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, CheckCircle2, Trophy, Timer, Video, X, Play, RotateCcw } from 'lucide-react';
import { WorkoutTemplate, Exercise, WorkoutLog, SetRecord, ExerciseType } from '../types';
import { videoDb } from '../utils/videoDb';

interface ActiveWorkoutScreenProps {
  template: WorkoutTemplate;
  library: Exercise[];
  onBack: () => void;
  onComplete: (log: WorkoutLog) => void;
  previousLogs: WorkoutLog[];
}

export const ActiveWorkoutScreen: React.FC<ActiveWorkoutScreenProps> = ({ 
  template, 
  library,
  onBack, 
  onComplete,
  previousLogs 
}) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [recordedData, setRecordedData] = useState<Record<number, SetRecord[]>>({});
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [showVideoOverlay, setShowVideoOverlay] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  
  // Exercise-specific rest timers
  const [restTimers, setRestTimers] = useState<Record<number, number>>({});
  const [activeTimers, setActiveTimers] = useState<Set<number>>(new Set());

  useEffect(() => {
    let interval: number;
    if (activeTimers.size > 0) {
      interval = window.setInterval(() => {
        setRestTimers(prev => {
          const next = { ...prev };
          let changed = false;
          activeTimers.forEach(idx => {
            if (next[idx] > 0) {
              next[idx] -= 1;
              changed = true;
              if (next[idx] === 0) {
                // Timer finished
                setActiveTimers(cur => {
                  const nextActive = new Set(cur);
                  nextActive.delete(idx);
                  return nextActive;
                });
                // Play notification sound
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(() => {});
              }
            }
          });
          return changed ? next : prev;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimers]);

  const currentEntry = currentExerciseIndex !== null ? template.exercises[currentExerciseIndex] : null;
  const currentExercise = currentEntry ? library.find(e => e.id === currentEntry.exerciseId) : null;

  // Stable Video Load
  const videoLoadedId = useRef<string | null>(null);
  useEffect(() => {
    if (currentExercise && showVideoOverlay && videoLoadedId.current !== currentExercise.id) {
      const loadVideo = async () => {
        const blob = await videoDb.getVideo(currentExercise.id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          setCurrentVideoUrl(url);
          videoLoadedId.current = currentExercise.id;
        }
      };
      loadVideo();
    } else if (!showVideoOverlay) {
      if (currentVideoUrl) {
        URL.revokeObjectURL(currentVideoUrl);
        setCurrentVideoUrl(null);
        videoLoadedId.current = null;
      }
    }
  }, [currentExercise, showVideoOverlay]);

  const handleStartRest = (idx: number) => {
    const entry = template.exercises[idx];
    setRestTimers(prev => ({ ...prev, [idx]: entry.restTime }));
    setActiveTimers(prev => new Set(prev).add(idx));
  };

  const handleResetRest = (idx: number) => {
    setActiveTimers(prev => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
    setRestTimers(prev => ({ ...prev, [idx]: 0 }));
  };

  const getPastPerformance = (exerciseId: string) => {
    return previousLogs
      .filter(log => log.exercisePerformances.some(p => p.exerciseId === exerciseId))
      .sort((a, b) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime())
      .slice(0, 3)
      .map(l => ({
        date: l.dateCompleted,
        perf: l.exercisePerformances.find(p => p.exerciseId === exerciseId)
      }));
  };

  const handleSetChange = (exerciseIdx: number, setIdx: number, field: keyof SetRecord, value: string | number) => {
    setRecordedData(prev => {
      const entry = template.exercises[exerciseIdx];
      const sets = [...(prev[exerciseIdx] || Array(entry.sets).fill({ weight: 0, reps: 0, time: '' }))];
      sets[setIdx] = { ...sets[setIdx], [field]: field === 'weight' || field === 'reps' ? Number(value) : value };
      return { ...prev, [exerciseIdx]: sets };
    });
  };

  if (isRatingModalOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
        <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 border border-[#EEEEEE] text-center shadow-2xl">
          <Trophy className="w-14 h-14 text-[#FF4500] mx-auto mb-6" />
          <h2 className="text-2xl font-black mb-8 tracking-tight text-[#1A1A1A]">Session Complete!</h2>
          <div className="grid gap-3">
            {(['Super Easy', 'Easy', 'Moderate', 'Hard', 'Very Hard'] as WorkoutLog['rating'][]).map(r => (
              <button
                key={r}
                onClick={() => onComplete({
                  id: crypto.randomUUID(),
                  workoutTemplateId: template.id,
                  workoutName: template.name,
                  dateCompleted: new Date().toISOString().split('T')[0],
                  rating: r,
                  exercisePerformances: template.exercises.map((ex, i) => ({
                    exerciseId: ex.exerciseId,
                    date: new Date().toISOString().split('T')[0],
                    sets: recordedData[i] || []
                  }))
                })}
                className="w-full py-4 text-[11px] font-black uppercase tracking-[0.15em] border border-[#EEEEEE] rounded-2xl hover:bg-[#FF4500] hover:text-white hover:border-[#FF4500] transition-all"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentExerciseIndex === null) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] pt-6 pb-12 px-6 overflow-y-auto no-scrollbar">
        <button onClick={onBack} className="mb-6 p-2 -ml-2 text-[#CCCCCC] hover:text-[#FF4500] transition-colors">
          <ChevronLeft className="w-7 h-7" />
        </button>
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-[#1A1A1A] leading-none">{template.name}</h1>
          <p className="text-[11px] font-black text-[#AAAAAA] uppercase tracking-[0.25em] mt-3">Routines Overview</p>
        </div>

        <div className="space-y-4 mb-12">
          {template.exercises.map((entry, idx) => {
            const isFinished = completedExercises.has(idx);
            const timeLeft = restTimers[idx] || 0;
            const isTimerActive = activeTimers.has(idx);
            
            return (
              <div key={idx} className="space-y-2">
                <button
                  onClick={() => setCurrentExerciseIndex(idx)}
                  className={`w-full flex items-center gap-5 p-6 bg-white border rounded-[2rem] text-left transition-all ${isFinished ? 'border-[#EEEEEE] opacity-60' : 'border-[#EEEEEE] hover:border-[#FF4500]/20'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${isFinished ? 'bg-[#FF4500] text-white' : 'bg-[#F5F5F5] text-[#BBBBBB]'}`}>
                    {isFinished ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#1A1A1A]">{entry.exerciseName}</h4>
                      {entry.isSuperset && <span className="text-[8px] font-black bg-[#FF4500]/10 text-[#FF4500] px-1.5 py-0.5 rounded uppercase tracking-tighter">Super</span>}
                    </div>
                    <p className="text-[10px] font-black text-[#AAAAAA] uppercase tracking-widest mt-1">
                      {entry.sets} Sets • {entry.reps > 0 ? `${entry.reps} Reps` : entry.time}
                    </p>
                  </div>
                </button>
                
                {/* Individual Rest Timer Button */}
                {entry.restTime > 0 && !isFinished && (
                  <div className="px-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); isTimerActive ? handleResetRest(idx) : handleStartRest(idx); }}
                      className={`
                        w-full py-2.5 rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all
                        ${isTimerActive ? 'bg-black text-white' : 'bg-white border border-[#FF4500]/20 text-[#FF4500] hover:bg-[#FF4500]/5'}
                      `}
                    >
                      <Timer className={`w-3 h-3 ${isTimerActive ? 'animate-pulse' : ''}`} />
                      {isTimerActive ? `Resting: ${timeLeft}s` : `Rest Timer (${entry.restTime}s)`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setIsRatingModalOpen(true)}
          className="w-full py-5 bg-[#FF4500] text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-[#FF4500]/20 active:scale-95 transition-all"
        >
          Finish Workout
        </button>
      </div>
    );
  }

  const past = getPastPerformance(currentEntry!.exerciseId);

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col pt-6 px-6 pb-20 relative">
      <div className="flex justify-between items-center mb-10">
        <button onClick={() => setCurrentExerciseIndex(null)} className="p-2 -ml-2 text-[#CCCCCC] hover:text-[#4A4A4A]">
          <ChevronLeft className="w-7 h-7" />
        </button>
        <div className="flex items-center gap-4">
           {currentEntry!.restTime > 0 && (
             <button 
                onClick={() => activeTimers.has(currentExerciseIndex!) ? handleResetRest(currentExerciseIndex!) : handleStartRest(currentExerciseIndex!)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTimers.has(currentExerciseIndex!) ? 'bg-black text-white' : 'bg-[#FF4500]/10 text-[#FF4500]'}`}
             >
                <Timer className="w-3 h-3" />
                {activeTimers.has(currentExerciseIndex!) ? `${restTimers[currentExerciseIndex!] || 0}s` : `Rest`}
             </button>
           )}
           <button 
            onClick={() => { setCompletedExercises(p => new Set(p).add(currentExerciseIndex!)); setCurrentExerciseIndex(null); }}
            className="text-[11px] font-black text-[#FF4500] uppercase tracking-widest px-4 py-2"
          >
            Log & Exit
          </button>
        </div>
      </div>

      <div className="mb-10 flex justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-[#1A1A1A] mb-3 leading-tight">{currentEntry!.exerciseName}</h2>
          <p className="text-[#888888] text-sm font-medium leading-relaxed">{currentExercise?.description || "No instructions."}</p>
        </div>
        <button 
          onClick={() => setShowVideoOverlay(true)}
          className="w-12 h-12 bg-[#FF4500] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#FF4500]/20 shrink-0 mt-2"
        >
          <Video className="w-6 h-6" />
        </button>
      </div>

      {showVideoOverlay && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
          <button onClick={() => setShowVideoOverlay(false)} className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white z-10"><X className="w-6 h-6" /></button>
          <div className="w-full h-full">
            {currentVideoUrl ? (
              <video src={currentVideoUrl} controls autoPlay className="w-full h-full" playsInline />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-black uppercase tracking-widest">Guide Loading...</div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-10 mb-8">
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-[#CCCCCC] uppercase tracking-[0.2em] px-1">Past Results</h3>
          <div className="bg-white border border-[#EEEEEE] rounded-[1.5rem] p-5 space-y-4">
            {past.length > 0 ? past.map((p, i) => (
              <div key={i} className="flex justify-between items-center text-[10px] font-bold">
                <span className="uppercase text-[#AAAAAA]">{new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <span className="font-black text-[#1A1A1A]">{p.perf?.sets.map(s => `${s.weight}kg x ${s.reps}`).join(' • ')}</span>
              </div>
            )) : <p className="text-[10px] text-[#DDDDDD] font-black uppercase tracking-widest text-center py-2">First recorded session</p>}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-[#CCCCCC] uppercase tracking-[0.2em] px-1">Tracking</h3>
          
          {/* Header row for tracking fields */}
          <div className="flex items-center gap-4 px-5 mb-1">
            <div className="w-4" /> {/* Set number placeholder */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              {currentExercise?.type === ExerciseType.SETS_REPS ? (
                <>
                  <span className="text-[9px] font-black text-[#AAAAAA] uppercase tracking-wider">Weight (KG)</span>
                  <span className="text-[9px] font-black text-[#AAAAAA] uppercase tracking-wider text-right">Reps</span>
                </>
              ) : (
                <span className="text-[9px] font-black text-[#AAAAAA] uppercase tracking-wider">Time / Duration</span>
              )}
            </div>
          </div>

          {Array.from({ length: currentEntry!.sets }).map((_, i) => {
            const data = recordedData[currentExerciseIndex!]?.[i] || { weight: 0, reps: 0, time: '' };
            const isSetsReps = currentExercise?.type === ExerciseType.SETS_REPS;
            
            return (
              <div key={i} className="flex items-center gap-4 bg-white p-5 rounded-[1.5rem] border border-[#EEEEEE] group focus-within:border-[#FF4500]/30 transition-all">
                <span className="text-[10px] font-black text-[#CCCCCC] w-4">{i + 1}</span>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  {isSetsReps ? (
                    <>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={data.weight || ''} 
                          placeholder="0"
                          onChange={e => handleSetChange(currentExerciseIndex!, i, 'weight', e.target.value)} 
                          className="w-full bg-transparent border-none text-[#1A1A1A] font-black text-xl outline-none placeholder:text-[#EEEEEE]" 
                        />
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <input 
                          type="number" 
                          value={data.reps || ''} 
                          placeholder="0"
                          onChange={e => handleSetChange(currentExerciseIndex!, i, 'reps', e.target.value)} 
                          className="w-full bg-transparent border-none text-right text-[#FF4500] font-black text-xl outline-none placeholder:text-[#EEEEEE]" 
                        />
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 flex items-center gap-2">
                      <input 
                        type="text" 
                        value={data.time || ''} 
                        placeholder="e.g. 60s"
                        onChange={e => handleSetChange(currentExerciseIndex!, i, 'time', e.target.value)} 
                        className="w-full bg-transparent border-none text-[#1A1A1A] font-black text-xl outline-none placeholder:text-[#EEEEEE]" 
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
