
import React from 'react';
import { Claim, VerdictLabel, EvidenceGrade } from '../types';
import { CREDIBILITY_SOURCES } from '../constants';

interface ClaimDetailProps {
  claim: Claim;
  onBack: () => void;
}

const getVerdictStyle = (label: VerdictLabel) => ({
  verified: { bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50', border: 'border-cyan-200', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]' },
  plausible_unverified: { bg: 'bg-slate-500', text: 'text-slate-600', light: 'bg-slate-50', border: 'border-slate-200', glow: '' },
  speculative: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-orange-200', glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]' },
  misleading: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-200', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]' },
}[label]);

const getGradeStyle = (grade: EvidenceGrade) => ({
  A: { bg: 'bg-cyan-500', text: 'text-cyan-700', light: 'bg-cyan-50', label: 'Primary' },
  B: { bg: 'bg-slate-500', text: 'text-slate-700', light: 'bg-slate-50', label: 'Strong Secondary' },
  C: { bg: 'bg-orange-400', text: 'text-orange-700', light: 'bg-orange-50', label: 'Weak Secondary' },
  D: { bg: 'bg-red-400', text: 'text-red-700', light: 'bg-red-50', label: 'Speculative' },
}[grade]);

const getStanceStyle = (stance: string) => ({
  supports: { bg: 'bg-cyan-100', text: 'text-cyan-700', icon: '✓' },
  contradicts: { bg: 'bg-red-100', text: 'text-red-700', icon: '✗' },
  mentions: { bg: 'bg-slate-100', text: 'text-slate-600', icon: '○' },
}[stance] || { bg: 'bg-slate-100', text: 'text-slate-600', icon: '?' });

const getClaimTypeLabel = (type: string) => ({
  filing_submitted: 'Filing Submitted',
  filing_approved_or_denied: 'Filing Decision',
  regulatory_action: 'Regulatory Action',
  listing_announced: 'Listing Announced',
  exploit_or_hack: 'Security Incident',
  mainnet_launch: 'Mainnet Launch',
  partnership_announced: 'Partnership',
  price_prediction: 'Price Prediction',
  rumor: 'Rumor',
  misc_claim: 'Miscellaneous',
}[type] || 'Claim');

export const ClaimDetail: React.FC<ClaimDetailProps> = ({ claim, onBack }) => {
  const source = CREDIBILITY_SOURCES[claim.sourceId];
  const verdict = claim.verdict;
  const style = verdict ? getVerdictStyle(verdict.verdictLabel) : null;

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 md:px-12 relative z-10 animate-in fade-in duration-700">
      <button
        onClick={onBack}
        className="flex items-center text-[10px] font-black tracking-[0.3em] text-slate-500 hover:text-cyan-500 mb-12 group transition-colors uppercase"
      >
        <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
        Return to Claims Feed
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-10">
          {/* Verdict Badge */}
          {verdict && (
            <div className={`${style?.light} ${style?.border} border rounded-[2rem] p-8 ${style?.glow}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${style?.bg} ${verdict.verdictLabel === 'verified' ? 'shadow-[0_0_12px_cyan]' : ''}`}></div>
                  <span className={`text-2xl font-black uppercase tracking-tight ${style?.text}`}>
                    {verdict.verdictLabel.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {getClaimTypeLabel(claim.claimType)}
                </span>
              </div>

              <h1 className="text-4xl font-black leading-tight text-slate-900 tracking-tighter mb-8">
                {claim.claimText}
              </h1>

              <div className="flex flex-wrap gap-3">
                {claim.assetSymbols.map(s => (
                  <span key={s} className="px-4 py-2 bg-white/80 text-cyan-700 rounded-xl text-xs font-black uppercase tracking-widest border border-cyan-100">
                    ${s}
                  </span>
                ))}
                {claim.resolution && (
                  <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                    claim.resolution.outcome === 'true' ? 'bg-cyan-500 text-white' :
                    claim.resolution.outcome === 'false' ? 'bg-red-500 text-white' :
                    'bg-slate-400 text-white'
                  }`}>
                    Ground Truth: {claim.resolution.outcome}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Verdict Analysis */}
          {verdict && (
            <div className="glass rounded-[2rem] p-10 border border-slate-100 bg-white/50">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Due Diligence Verdict
              </h3>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="p-6 bg-slate-50 rounded-2xl">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Probability True</div>
                  <div className={`text-4xl font-black ${style?.text}`}>
                    {(verdict.probabilityTrue * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Evidence Strength</div>
                  <div className="text-4xl font-black text-slate-900">
                    {(verdict.evidenceStrength * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Analysis Summary</div>
                  <p className="text-lg text-slate-700 leading-relaxed">{verdict.reasoningSummary}</p>
                </div>

                <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
                  <div className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    What Would Change This Verdict?
                  </div>
                  <p className="text-sm text-orange-800">{verdict.invalidationTriggers}</p>
                </div>
              </div>
            </div>
          )}

          {/* Evidence Ladder */}
          <div className="glass rounded-[2rem] p-10 border border-slate-100 bg-white/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Evidence Ladder
              </h3>
              <span className="text-xs font-black text-cyan-600">{claim.evidence.length} Sources</span>
            </div>

            <div className="space-y-4">
              {claim.evidence.map((ev) => {
                const gradeStyle = getGradeStyle(ev.grade);
                const stanceStyle = getStanceStyle(ev.stance);

                return (
                  <div key={ev.id} className="p-6 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${gradeStyle?.bg} flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0`}>
                        {ev.grade}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-slate-800">{ev.publisher}</span>
                          <span className={`px-2 py-1 ${stanceStyle.bg} ${stanceStyle.text} rounded-lg text-[10px] font-black uppercase tracking-widest`}>
                            {stanceStyle.icon} {ev.stance}
                          </span>
                          <span className={`px-2 py-1 ${gradeStyle?.light} ${gradeStyle?.text} rounded-lg text-[10px] font-black uppercase tracking-widest`}>
                            {gradeStyle?.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{ev.excerpt}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          {/* Source Profile */}
          {source && (
            <div className="glass rounded-[2.5rem] p-10 border-slate-100 sticky top-28 shadow-2xl bg-white/50">
              <h3 className="font-black text-xs tracking-[0.3em] text-slate-400 uppercase mb-8">Asserting Source</h3>

              <div className="flex items-center space-x-4 mb-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl ${
                  source.score.trackRecord >= 70 ? 'bg-cyan-500 text-white' :
                  source.score.trackRecord >= 50 ? 'bg-slate-400 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {source.logo}
                </div>
                <div>
                  <div className="font-black text-xl text-slate-900">{source.displayName}</div>
                  <div className="text-sm text-slate-500">{source.handleOrDomain}</div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Track Record</span>
                    <span className={`text-lg font-black ${
                      source.score.trackRecord >= 70 ? 'text-cyan-600' :
                      source.score.trackRecord >= 50 ? 'text-slate-600' : 'text-orange-600'
                    }`}>
                      {source.score.trackRecord}
                      <span className="text-sm text-slate-400 font-normal">
                        ±{Math.round((source.score.confidenceInterval.upper - source.score.confidenceInterval.lower) / 2)}
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        source.score.trackRecord >= 70 ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' :
                        source.score.trackRecord >= 50 ? 'bg-slate-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${source.score.trackRecord}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Method Discipline</span>
                    <span className="text-lg font-black text-slate-700">{source.score.methodDiscipline}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-500 rounded-full"
                      style={{ width: `${source.score.methodDiscipline}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
                  Based on {source.score.sampleSize} resolved claims
                </div>
              </div>
            </div>
          )}

          {/* Claim Metadata */}
          <div className="glass rounded-[2.5rem] p-10 border-slate-100 bg-white/50">
            <h3 className="font-black text-xs tracking-[0.3em] text-slate-400 uppercase mb-8">Claim Metadata</h3>

            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Falsifiability</span>
                <span className="text-sm font-bold text-slate-900">{(claim.falsifiabilityScore * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Initial Confidence</span>
                <span className="text-sm font-bold text-slate-900">{(claim.llmConfidence * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Resolution Type</span>
                <span className="text-sm font-bold text-slate-900 capitalize">{claim.resolutionType}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-sm text-slate-500">Status</span>
                <span className="text-sm font-bold text-slate-900 capitalize">{claim.status}</span>
              </div>
            </div>

            {claim.resolveBy && (
              <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-1">Resolution Deadline</div>
                <div className="text-sm text-orange-800">{new Date(claim.resolveBy).toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
