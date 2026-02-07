
import React from 'react';
import { NewsStory } from '../types';
import { VeracityBar } from './VeracityBar';

interface NewsCardProps {
  story: NewsStory;
  variant?: 'featured' | 'standard' | 'minimal';
}

export const NewsCard: React.FC<NewsCardProps> = ({ story, variant = 'standard' }) => {
  const isConfirmdOriginal = story.isSynthesized;

  if (variant === 'featured' || isConfirmdOriginal) {
    return (
      <div className={`group cursor-pointer glass p-8 rounded-[2.5rem] transition-all duration-500 hover:-translate-y-2 border ${
        isConfirmdOriginal 
          ? 'border-cyan-200 shadow-[0_10px_50px_rgba(6,182,212,0.15)] bg-cyan-50/20' 
          : 'border-slate-100 hover:shadow-[0_10px_50px_rgba(0,0,0,0.05)] bg-white'
      }`}>
        <div className="relative rounded-[2rem] overflow-hidden mb-8 aspect-[21/9] shadow-2xl">
          <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
          <div className="absolute top-6 left-6 flex items-center space-x-3 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
            {/* Background color changed to cyan-600 for Confirmd Originals */}
            <span className={`bg-cyan-600 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-xl`}>
              {isConfirmdOriginal ? 'Confirmd Original' : 'Verified Signal'}
            </span>
            {isConfirmdOriginal && (
              <div className="flex -space-x-2 pl-1 pr-2">
                {story.sources.slice(0, 3).map((s, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[7px] font-black text-white shadow-lg">
                    {s.logo}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex items-center space-x-3 text-[10px] font-black tracking-[0.3em] text-cyan-600 uppercase transition-colors">
             <span>{story.category}</span>
             <span className="text-slate-300">•</span>
             <span>{story.timeLabel}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black leading-tight text-slate-900 group-hover:text-cyan-600 transition-colors tracking-tighter">
            {story.title}
          </h2>
          <p className="text-slate-500 line-clamp-2 leading-relaxed text-xl font-medium">{story.summary}</p>
          <div className="flex items-center space-x-4 text-xs font-bold text-slate-400 pb-6 border-b border-slate-100">
             <span>{isConfirmdOriginal ? 'SYNTHESIZED FROM' : ''} {story.sources.length} SOURCES ANALYZED</span>
          </div>
          <VeracityBar distribution={story.veracity} showLabels />
        </div>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-[2rem] bg-white transition-all duration-500 hover:shadow-[0_10px_40px_rgba(0,0,0,0.04)] cursor-pointer group hover:-translate-y-2 border border-slate-100">
      <div className="flex space-x-6">
        <div className="flex-1 space-y-4">
          <span className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.3em] transition-colors">{story.category}</span>
          <h3 className="font-black text-2xl leading-tight text-slate-900 group-hover:text-cyan-600 transition-colors line-clamp-3 tracking-tight">{story.title}</h3>
          <div className="flex items-center text-[10px] font-bold text-slate-400 space-x-3 transition-colors">
            <span>{story.sources.length} SOURCES</span>
            <span className="text-slate-300">•</span>
            <span>{story.timeLabel}</span>
          </div>
        </div>
        <div className="w-32 h-32 flex-shrink-0 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
          <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-slate-100 transition-colors">
        <VeracityBar distribution={story.veracity} />
      </div>
    </div>
  );
};
