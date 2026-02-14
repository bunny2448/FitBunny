
import React, { useState, useEffect } from 'react';
import { Trash2, Video as VideoIcon, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { Exercise } from '../types';
import { videoDb } from '../utils/videoDb';

interface LibraryViewProps {
  exercises: Exercise[];
  onDelete: (id: string) => void;
  totalCount: number;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ exercises, onDelete, totalCount }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (expandedId) {
      const loadVideo = async () => {
        const blob = await videoDb.getVideo(expandedId);
        if (blob) {
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
        } else {
          setVideoUrl(null);
        }
      };
      loadVideo();
    } else {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
    }
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [expandedId]);

  if (totalCount === 0) {
    return (
      <div className="py-20 text-center bg-white border border-[#EEEEEE] rounded-[2rem]">
        <p className="text-[#AAAAAA] font-bold">Exercise library is empty.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {exercises.map((ex) => (
        <div 
          key={ex.id} 
          className={`
            bg-white border rounded-[1.5rem] overflow-hidden transition-all duration-300
            ${expandedId === ex.id ? 'border-[#FF4500]/30 shadow-xl shadow-[#FF4500]/5' : 'border-[#EEEEEE] hover:border-[#DDDDDD]'}
          `}
        >
          <button 
            onClick={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
            className="w-full p-6 flex items-center justify-between text-left"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-[#1A1A1A] truncate">{ex.name}</h3>
              <p className="text-[10px] font-black text-[#AAAAAA] uppercase tracking-widest mt-1">{ex.type}</p>
            </div>
            <div className={`transition-colors ${expandedId === ex.id ? 'text-[#FF4500]' : 'text-[#CCCCCC]'}`}>
              {expandedId === ex.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {expandedId === ex.id && (
            <div className="px-6 pb-6 pt-0 space-y-5 animate-in slide-in-from-top-2 duration-300">
              {videoUrl ? (
                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-[#EEEEEE]">
                  <video 
                    src={videoUrl} 
                    controls 
                    className="w-full h-full object-cover"
                    playsInline
                  />
                </div>
              ) : ex.videoPath ? (
                <div className="p-8 text-center bg-[#F9F9F9] rounded-2xl border border-[#EEEEEE]">
                  <p className="text-xs font-bold text-[#AAAAAA] italic">Locating video file...</p>
                </div>
              ) : null}

              <p className="text-[#666666] text-sm leading-relaxed font-medium">
                {ex.description || <span className="italic opacity-50">No instructions.</span>}
              </p>

              <div className="flex justify-end pt-3 border-t border-[#F5F5F5]">
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(ex.id); }}
                  className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest py-2 px-4 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
