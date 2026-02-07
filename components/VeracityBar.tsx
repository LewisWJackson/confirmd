
import React from 'react';
import { VeracityDistribution } from '../types';

interface VeracityBarProps {
  distribution: VeracityDistribution;
  showLabels?: boolean;
}

export const VeracityBar: React.FC<VeracityBarProps> = ({ distribution, showLabels = false }) => {
  return (
    <div className="w-full">
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100 border border-slate-200 p-[1px]">
        <div 
          className="h-full bg-cyan-500 transition-all duration-700 rounded-l-full shadow-[0_0_10px_rgba(6,182,212,0.3)]" 
          style={{ width: `${distribution.verified}%` }}
        />
        <div 
          className="h-full bg-slate-400 transition-all duration-700" 
          style={{ width: `${distribution.balanced}%` }}
        />
        <div 
          className="h-full bg-orange-500 transition-all duration-700 rounded-r-full shadow-[0_0_10px_rgba(249,115,22,0.3)]" 
          style={{ width: `${distribution.speculative}%` }}
        />
      </div>
      
      {showLabels && (
        <div className="grid grid-cols-3 gap-2 mt-4 text-[9px] font-black uppercase tracking-[0.2em]">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center text-cyan-600">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mr-2 shadow-[0_0_5px_cyan]"></div>
              Verified
            </div>
            <span className="text-slate-900 ml-3.5">{distribution.verified}%</span>
          </div>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2"></div>
              Balanced
            </div>
            <span className="text-slate-900 ml-3.5">{distribution.balanced}%</span>
          </div>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center text-orange-600">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2 shadow-[0_0_5px_orange]"></div>
              Speculative
            </div>
            <span className="text-slate-900 ml-3.5">{distribution.speculative}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
