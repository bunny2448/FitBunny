
import React, { useMemo } from 'react';
import { Star, Activity, History, Calendar as CalendarIcon, Trophy, Target } from 'lucide-react';
import { WorkoutLog } from '../types';

interface HistoryViewProps {
  logs: WorkoutLog[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ logs }) => {
  const sortedLogs = useMemo(() => 
    [...logs].sort((a, b) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime()),
    [logs]
  );

  const stats = useMemo(() => {
    const now = new Date();
    
    // Week starts on Saturday
    // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
    const day = now.getDay();
    const diffToSaturday = (day + 1) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToSaturday);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekCount = logs.filter(log => {
      const logDate = new Date(log.dateCompleted);
      // Since dateCompleted is YYYY-MM-DD, we ensure we compare at start of day
      logDate.setHours(0, 0, 0, 0);
      return logDate >= startOfWeek;
    }).length;

    const monthCount = logs.filter(log => {
      const logDate = new Date(log.dateCompleted);
      return logDate.getFullYear() === now.getFullYear() && logDate.getMonth() === now.getMonth();
    }).length;

    return {
      week: weekCount,
      month: monthCount,
      total: logs.length
    };
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="py-32 text-center bg-white border border-[#EEEEEE] rounded-[2rem] flex flex-col items-center">
        <div className="w-16 h-16 bg-[#F9F9F9] rounded-3xl flex items-center justify-center text-[#DDDDDD] mb-6">
          <History className="w-8 h-8" />
        </div>
        <p className="text-[#AAAAAA] font-bold text-sm">Finish your first workout to see results.</p>
      </div>
    );
  }

  const getRatingColor = (rating: string) => {
    if (rating.includes('Hard')) return 'text-rose-500 bg-rose-50';
    if (rating.includes('Easy')) return 'text-emerald-500 bg-emerald-50';
    return 'text-[#FF4500] bg-[#FF4500]/10';
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Stats Summary Grid */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-[#EEEEEE] rounded-[1.5rem] p-4 flex flex-col items-center text-center shadow-sm">
          <div className="w-8 h-8 rounded-full bg-[#FF4500]/10 flex items-center justify-center mb-2">
            <CalendarIcon className="w-4 h-4 text-[#FF4500]" />
          </div>
          <span className="text-[18px] font-black text-[#1A1A1A]">{stats.week}</span>
          <span className="text-[8px] font-black text-[#AAAAAA] uppercase tracking-widest">This Week</span>
          <span className="text-[7px] text-[#DDDDDD] mt-1 font-bold italic">(Sat Start)</span>
        </div>
        <div className="bg-white border border-[#EEEEEE] rounded-[1.5rem] p-4 flex flex-col items-center text-center shadow-sm">
          <div className="w-8 h-8 rounded-full bg-[#FF4500]/10 flex items-center justify-center mb-2">
            <Target className="w-4 h-4 text-[#FF4500]" />
          </div>
          <span className="text-[18px] font-black text-[#1A1A1A]">{stats.month}</span>
          <span className="text-[8px] font-black text-[#AAAAAA] uppercase tracking-widest">This Month</span>
        </div>
        <div className="bg-white border border-[#EEEEEE] rounded-[1.5rem] p-4 flex flex-col items-center text-center shadow-sm">
          <div className="w-8 h-8 rounded-full bg-[#FF4500]/10 flex items-center justify-center mb-2">
            <Trophy className="w-4 h-4 text-[#FF4500]" />
          </div>
          <span className="text-[18px] font-black text-[#1A1A1A]">{stats.total}</span>
          <span className="text-[8px] font-black text-[#AAAAAA] uppercase tracking-widest">Total Done</span>
        </div>
      </section>

      <div className="space-y-6">
        <h2 className="text-[11px] font-black text-[#AAAAAA] uppercase tracking-[0.25em]">Session History</h2>
        <div className="space-y-3">
          {sortedLogs.map(log => (
            <div key={log.id} className="bg-white border border-[#EEEEEE] rounded-[2rem] p-6 flex flex-col gap-3 group transition-all hover:border-[#FF4500]/20">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-black text-[#1A1A1A] leading-tight">{log.workoutName}</h4>
                  <p className="text-[10px] font-black text-[#AAAAAA] uppercase tracking-widest mt-1.5">{new Date(log.dateCompleted).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full ${getRatingColor(log.rating)}`}>
                  {log.rating}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#F9F9F9] flex flex-wrap gap-x-6 gap-y-2">
                {log.exercisePerformances.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF4500]/30" />
                    <span className="text-[10px] text-[#888888] font-bold tracking-tight">
                      {p.sets.length} Sets recorded
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
