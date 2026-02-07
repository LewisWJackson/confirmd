
import React from 'react';
import { Claim, VerdictLabel } from '../types';
import { CREDIBILITY_SOURCES } from '../constants';

interface ClaimCardProps {
  claim: Claim;
  onClick?: () => void;
}

const getVerdictStyle = (label: VerdictLabel) => ({
  verified: { bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50', border: 'border-cyan-200' },
  plausible_unverified: { bg: 'bg-slate-500', text: 'text-slate-600', light: 'bg-slate-50', border: 'border-slate-200' },
  speculative: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-orange-200' },
  misleading: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-200' },
}[label]);

const getClaimTypeLabel = (type: string) => ({
  filing_submitted: 'Filing Submitted',
  filing_approved_or_denied: 'Filing Decision',
  regulatory_action: 'Regulatory',
  listing_announced: 'Listing',
  exploit_or_hack: 'Security Incident',
  mainnet_launch: 'Launch',
  partnership_announced: 'Partnership',
  price_prediction: 'Prediction',
  rumor: 'Rumor',
  misc_claim: 'Claim',
}[type] || 'Claim');

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export const ClaimCard: React.FC<ClaimCardProps> = ({ claim, onClick }) => {
  const source = CREDIBILITY_SOURCES[claim.sourceId];
  const verdict = claim.verdict;
  const style = verdict ? getVerdictStyle(verdict.verdictLabel) : null;

  return (
    <div
      onClick={onClick}
      className={`glass rounded-[2rem] p-8 border ${style?.border || 'border-slate-200'} hover:shadow-2xl transition-all duration-500 cursor-pointer group bg-white/50`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-lg ${
            source?.score.trackRecord >= 70 ? 'bg-cyan-500 text-white' :
            source?.score.trackRecord >= 50 ? 'bg-slate-400 text-white' : 'bg-orange-500 text-white'
          }`}>
            {source?.logo || '?'}
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800">{source?.displayName || 'Unknown'}</span>
            <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
              {formatTime(claim.assertedAt)}
            </div>
          </div>
        </div>

        {verdict && (
          <div className={`px-4 py-2 ${style?.light} ${style?.text} rounded-xl text-[10px] font-black uppercase tracking-widest border ${style?.border}`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${style?.bg} ${verdict.verdictLabel === 'verified' ? 'shadow-[0_0_8px_cyan]' : ''}`}></div>
              <span>{verdict.verdictLabel.replace('_', ' ')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Claim Text */}
      <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4 group-hover:text-cyan-600 transition-colors leading-tight">
        {claim.claimText}
      </h3>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
          {getClaimTypeLabel(claim.claimType)}
        </span>
        {claim.assetSymbols.map(s => (
          <span key={s} className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-cyan-100">
            ${s}
          </span>
        ))}
        {claim.resolution && (
          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
            claim.resolution.outcome === 'true' ? 'bg-cyan-100 text-cyan-700' :
            claim.resolution.outcome === 'false' ? 'bg-red-100 text-red-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            Resolved: {claim.resolution.outcome}
          </span>
        )}
      </div>

      {/* Verdict Metrics */}
      {verdict && (
        <div className="border-t border-slate-100 pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                <span className="text-slate-400">Probability True</span>
                <span className={style?.text}>{(verdict.probabilityTrue * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${style?.bg} rounded-full transition-all duration-700 ${verdict.verdictLabel === 'verified' ? 'shadow-[0_0_10px_rgba(6,182,212,0.5)]' : ''}`}
                  style={{ width: `${verdict.probabilityTrue * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                <span className="text-slate-400">Evidence Strength</span>
                <span className="text-slate-700">{(verdict.evidenceStrength * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-600 rounded-full transition-all duration-700"
                  style={{ width: `${verdict.evidenceStrength * 100}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-600 mt-4 line-clamp-2">
            {verdict.reasoningSummary}
          </p>
        </div>
      )}

      {/* Evidence Count */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{claim.evidence.length} evidence items</span>
        </div>
        <div className="text-[10px] font-black text-cyan-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
          View Analysis →
        </div>
      </div>
    </div>
  );
};
