
import React, { useState, useRef } from 'react';
import { X, Camera, Check, Video, Trash2 } from 'lucide-react';
import { Exercise, ExerciseType } from '../types';
import { videoDb } from '../utils/videoDb';

interface ExerciseFormProps {
  onClose: () => void;
  onSubmit: (exercise: Omit<Exercise, 'id'>) => boolean;
}

export const ExerciseForm: React.FC<ExerciseFormProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Omit<Exercise, 'id'>>({
    name: '',
    description: '',
    type: ExerciseType.SETS_REPS,
    videoPath: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, videoPath: file.name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    // We generate the ID here to use it for the video storage
    const tempId = crypto.randomUUID();
    
    if (selectedFile) {
      try {
        await videoDb.saveVideo(tempId, selectedFile);
      } catch (err) {
        console.error("Failed to save video to local storage", err);
      }
    }

    const success = onSubmit({ 
      ...formData, 
      id: tempId // We pass the ID explicitly to the handler if needed, but our App.tsx generates one.
      // Let's modify App.tsx as well or ensure we use the same ID.
    } as any);

    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in scale-in duration-300">
        <div className="px-8 py-6 border-b border-[#F5F5F5] flex justify-between items-center">
          <h3 className="text-xl font-black text-[#1A1A1A]">New Exercise</h3>
          <button onClick={onClose} className="p-2 text-[#CCCCCC] hover:text-[#4A4A4A] rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-[#AAAAAA] uppercase tracking-[0.2em] mb-2 px-1">Exercise Name</label>
              <input 
                autoFocus
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Kettlebell Swing"
                className="w-full px-5 py-4 bg-[#F9F9F9] border border-[#EEEEEE] rounded-2xl focus:border-[#FF4500] outline-none transition-all font-bold text-[#1A1A1A]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#AAAAAA] uppercase tracking-[0.2em] mb-3 px-1">Tracking Type</label>
              <div className="flex gap-2">
                {Object.values(ExerciseType).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type }))}
                    className={`
                      flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all
                      ${formData.type === type 
                        ? 'bg-[#FF4500] border-[#FF4500] text-white shadow-md' 
                        : 'bg-white border-[#EEEEEE] text-[#AAAAAA] hover:border-[#DDDDDD]'}
                    `}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#AAAAAA] uppercase tracking-[0.2em] mb-2 px-1">Description</label>
              <textarea 
                rows={3}
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Key form tips..."
                className="w-full px-5 py-4 bg-[#F9F9F9] border border-[#EEEEEE] rounded-2xl focus:border-[#FF4500] outline-none transition-all font-medium text-sm text-[#4A4A4A] resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#AAAAAA] uppercase tracking-[0.2em] mb-3 px-1">Exercise Video</label>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="video/*" 
                className="hidden" 
              />
              {selectedFile ? (
                <div className="flex items-center justify-between p-4 bg-[#F9F9F9] border border-[#FF4500]/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-[#FF4500]" />
                    <span className="text-sm font-bold text-[#4A4A4A] truncate max-w-[150px]">{selectedFile.name}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setSelectedFile(null)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#EEEEEE] rounded-2xl hover:border-[#FF4500]/30 hover:bg-[#FF4500]/5 transition-all text-[#AAAAAA] group"
                >
                  <Camera className="w-6 h-6 group-hover:text-[#FF4500]" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Add Reference Video</span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-10 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-[#AAAAAA] hover:text-[#4A4A4A] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-[2] py-4 bg-[#FF4500] text-white rounded-[1.2rem] font-black text-[11px] uppercase tracking-[0.15em] shadow-lg shadow-[#FF4500]/20 active:scale-[0.98] transition-all"
            >
              Add Exercise
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
