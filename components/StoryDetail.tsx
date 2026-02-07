
import React, { useState, useEffect } from 'react';
import { NewsStory, VeracityRating } from '../types';
import { VeracityBar } from './VeracityBar';

interface StoryDetailProps {
  story: NewsStory;
  onBack: () => void;
}

export const StoryDetail: React.FC<StoryDetailProps> = ({ story, onBack }) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight === 0) return;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative">
      {/* Reading Progress Bar - Sticky at the top of the viewport below header */}
      <div className="fixed top-[73px] left-0 w-full h-1 z-50 pointer-events-none">
        <div 
          className="h-full bg-cyan-500 shadow-[0_0_10px_cyan] transition-all duration-150 ease-out" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto py-12 px-6 md:px-12 relative z-10 animate-in fade-in duration-700">
        <button 
          onClick={onBack}
          className="flex items-center text-[10px] font-black tracking-[0.3em] text-slate-500 hover:text-cyan-500 mb-12 group transition-colors uppercase"
        >
          <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          Return to Signal Stream
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-10">
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 aspect-video">
              <img src={story.imageUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent"></div>
              <div className="absolute bottom-8 left-8">
                 {/* Updated styling to use brand cyan for CONFIRMD ORIGINAL */}
                 <span className={`px-4 py-2 ${story.isSynthesized ? 'bg-cyan-600 text-white' : 'bg-white/90 text-slate-900'} backdrop-blur-md text-[10px] font-black tracking-widest uppercase rounded-xl border border-white/50 shadow-2xl transition-colors`}>
                  {story.isSynthesized ? 'CONFIRMD ORIGINAL' : story.category} • {story.timeLabel}
                </span>
              </div>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-5xl font-black leading-tight text-slate-900 tracking-tighter">{story.title}</h1>
              <p className="text-2xl text-slate-600 leading-relaxed font-medium">{story.summary}</p>
              <div className="prose prose-slate max-w-none text-slate-600 text-lg leading-relaxed space-y-6">
                {story.fullContent?.split('\n').map((para, i) => (
                  <p key={i} className="mb-4">{para}</p>
                ))}
                {!story.fullContent && (
                  <>
                    <p>Building a multi-source news synthesis protocol requires rigorous attention to data provenance. In the current crypto landscape, the delta between "rumor" and "verification" is often intentionally blurred to drive liquidation events or retail FOMO.</p>
                    <p>Our methodology filters these signals by assigning veracity scores based on historical source reliability and cross-referencing on-chain data with traditional regulatory filings. By stripping away market-driven hyperbole, we provide a "Clean Room" reporting environment where data speaks louder than hype.</p>
                    <p>Institutional adoption is no longer a matter of "if" but a matter of technical plumbing. The structural integration occurring at the clearing house level suggests a permanent shift toward decentralized settlement as the global standard for 24/7 liquid markets.</p>
                  </>
                )}
              </div>

              {story.isSynthesized && story.synthesisNotes && (
                <div className="mt-12 p-10 rounded-[2.5rem] bg-cyan-50 border border-cyan-100">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-cyan-700 mb-6 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Synthesis Integrity Protocol
                  </h3>
                  <ul className="space-y-4">
                    {story.synthesisNotes.map((note, i) => (
                      <li key={i} className="flex items-start text-sm font-medium text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 mr-4 flex-shrink-0"></span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <div className="glass rounded-[2.5rem] p-10 border-slate-100 sticky top-28 shadow-2xl bg-white/50">
              <h3 className="font-black text-xs tracking-[0.3em] text-slate-400 uppercase mb-8">Veracity Analysis</h3>
              <VeracityBar distribution={story.veracity} showLabels />
              
              <div className="mt-12 space-y-8">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-[10px] tracking-widest text-slate-400 uppercase">Informing Sources</h4>
                  <span className="text-xs font-black text-cyan-600">{story.sources.length}</span>
                </div>
                
                <div className="space-y-3">
                  {story.sources.map((source) => (
                    <div key={source.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm transition-transform group-hover:scale-110 ${
                          source.rating === VeracityRating.VERIFIED ? 'bg-cyan-500 text-white' : 
                          source.rating === VeracityRating.BALANCED ? 'bg-slate-400 text-white' : 'bg-orange-500 text-white'
                        }`}>
                          {source.logo}
                        </div>
                        <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{source.name}</span>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        source.rating === VeracityRating.VERIFIED ? 'bg-cyan-500' : 
                        source.rating === VeracityRating.BALANCED ? 'bg-slate-500' : 'bg-orange-500'
                      }`}></div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full mt-12 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-xl">
                Cross-Reference Signal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
