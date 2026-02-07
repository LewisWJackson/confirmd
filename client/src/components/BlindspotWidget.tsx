
import React from 'react';
import { NewsStory } from '../types';

interface BlindspotWidgetProps {
  story: NewsStory;
}

export const BlindspotWidget: React.FC<BlindspotWidgetProps> = ({ story }) => {
  return (
    <div className="bg-white text-slate-900 rounded-[2.5rem] p-8 relative overflow-hidden group cursor-pointer shadow-xl border border-slate-100 hover:border-orange-200 transition-all">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-orange-500/5 blur-[80px] pointer-events-none group-hover:bg-orange-500/10 transition-all duration-700"></div>
      
      {/* Hype Scanner Pill - Increased padding from top/right to avoid overlapping tight corner */}
      <div className="absolute top-8 right-8 z-20">
        <div className="bg-orange-500 text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg border border-white/20">HYPE SCANNER</div>
      </div>
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform shadow-sm">
             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
               <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
               <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
             </svg>
          </div>
          <div>
            <span className="block text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none mb-1">Unfiltered Alert</span>
            <span className="text-[11px] font-bold text-slate-400">Speculative Edge Detected</span>
          </div>
        </div>
        <h3 className="text-2xl font-black leading-tight group-hover:text-orange-600 transition-colors tracking-tight pr-20">{story.title}</h3>
        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed font-medium">{story.summary}</p>
        <div className="pt-4 space-y-3">
           <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-[1px]">
              <div className="h-full bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.3)]" style={{ width: '85%' }}></div>
           </div>
           <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speculative Saturation</span>
              <span className="text-sm font-black text-orange-600">85%</span>
           </div>
        </div>
      </div>
    </div>
  );
};
