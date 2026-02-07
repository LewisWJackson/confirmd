
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Verified', value: 65, color: '#0891b2' },
  { name: 'Balanced', value: 20, color: '#64748b' },
  { name: 'Speculative', value: 15, color: '#f97316' },
];

export const VeracityAnalysis: React.FC = () => {
  const [showAuditModal, setShowAuditModal] = useState(false);

  return (
    <div className="glass rounded-[2rem] p-8 shadow-xl relative overflow-hidden group border-slate-100 bg-white/50">
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-cyan-500/5 blur-[60px] pointer-events-none group-hover:bg-cyan-500/10 transition-all"></div>
      
      <div className="relative z-10">
        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1">Consumption Profile</h3>
        <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Your Integrity Audit</h2>
        
        <div className="h-52 w-full mb-8 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={65}
                outerRadius={85}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span className="text-3xl font-black text-cyan-600">65</span>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VERIFIED</span>
          </div>
        </div>

        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: item.color, color: item.color }}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.name}</span>
              </div>
              <span className="text-sm font-black text-slate-900">{item.value}%</span>
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => setShowAuditModal(true)}
          className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-cyan-600 transition-all shadow-lg"
        >
          Run Veracity Audit
        </button>
      </div>

      {/* Audit Methodology Explainer Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setShowAuditModal(false)}></div>
          <div className="relative w-full max-w-xl glass p-10 rounded-[2.5rem] border-slate-100 shadow-2xl animate-in zoom-in-95 bg-white">
            <button onClick={() => setShowAuditModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="space-y-8">
              <div className="text-center">
                <span className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.4em]">Methodology v1.0</span>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter mt-3">How the Audit Works</h2>
                <p className="text-slate-500 mt-4 font-medium leading-relaxed px-6">
                  Confirmd does not track your browsing history. Instead, we use a decentralized analysis of your "Informational Inputs."
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 glass-light rounded-2xl border border-slate-100 space-y-3 group hover:border-cyan-500/30 transition-all">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h4 className="font-black text-xs uppercase tracking-widest text-slate-900">Social Sync</h4>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Analyze the bias ratings of journalists and influencers you follow on X or Bluesky.</p>
                </div>

                <div className="p-6 glass-light rounded-2xl border border-slate-100 space-y-3 group hover:border-cyan-500/30 transition-all">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                  </div>
                  <h4 className="font-black text-xs uppercase tracking-widest text-slate-900">Source Check</h4>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Manually add the outlets you read to see their weighted impact on your worldview.</p>
                </div>
              </div>

              <div className="p-6 bg-cyan-50 rounded-3xl border border-cyan-100">
                <div className="flex items-start space-x-4">
                   <div className="w-5 h-5 mt-1 text-cyan-600">
                     <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                   </div>
                   <p className="text-xs text-slate-600 font-bold leading-relaxed italic">
                     "The goal is to identify your Signal-to-Noise Ratio (SNR) and surface stories that your current bubble is filtering out."
                   </p>
                </div>
              </div>

              <button className="w-full py-5 bg-cyan-600 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl">
                Start My Signal Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
