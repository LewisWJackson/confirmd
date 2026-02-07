
import React from 'react';
import { CredibilitySource } from '../types';

interface SourceScoreCardProps {
  source: CredibilitySource;
  onClick?: () => void;
}

export const SourceScoreCard: React.FC<SourceScoreCardProps> = ({ source, onClick }) => {
  const score = source.score;
  const trackColor = score.trackRecord >= 70 ? 'text-cyan-600' : score.trackRecord >= 50 ? 'text-slate-600' : 'text-orange-600';
  const trackBg = score.trackRecord >= 70 ? 'bg-cyan-500' : score.trackRecord >= 50 ? 'bg-slate-500' : 'bg-orange-500';
  const trackGlow = score.trackRecord >= 70 ? 'shadow-[0_0_10px_rgba(6,182,212,0.5)]' : '';

  return (
    <div
      onClick={onClick}
      className="glass rounded-[2rem] p-8 border border-slate-200 hover:shadow-2xl transition-all duration-500 cursor-pointer group bg-white/50"
    >
      <div className="flex items-center space-x-4 mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-xl group-hover:scale-110 transition-transform ${
          score.trackRecord >= 70 ? 'bg-cyan-500 text-white' :
          score.trackRecord >= 50 ? 'bg-slate-400 text-white' : 'bg-orange-500 text-white'
        }`}>
          {source.logo}
        </div>
        <div>
          <div className="font-black text-lg text-slate-900 group-hover:text-cyan-600 transition-colors tracking-tight">{source.displayName}</div>
          <div className="text-xs text-slate-400">{source.handleOrDomain}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Track Record</div>
          <div className={`text-3xl font-black ${trackColor}`}>
            {score.trackRecord}
            <span className="text-sm text-slate-400 font-normal ml-1">
              ±{Math.round((score.confidenceInterval.upper - score.confidenceInterval.lower) / 2)}
            </span>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Method Discipline</div>
          <div className="text-3xl font-black text-slate-700">
            {score.methodDiscipline}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${trackBg} rounded-full ${trackGlow}`}
            style={{ width: `${score.trackRecord}%` }}
          />
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-500 rounded-full"
            style={{ width: `${score.methodDiscipline}%` }}
          />
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {score.sampleSize} resolved claims
        </span>
        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
          source.type === 'regulator' ? 'bg-cyan-100 text-cyan-700' :
          source.type === 'publisher' ? 'bg-slate-100 text-slate-600' :
          source.type === 'x_handle' ? 'bg-orange-100 text-orange-700' :
          'bg-slate-100 text-slate-500'
        }`}>
          {source.type.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
};
