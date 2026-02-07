
import React, { useState } from 'react';

interface AccountModalProps {
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-lg glass p-10 rounded-[2.5rem] border-slate-100 shadow-2xl animate-in zoom-in-95 duration-300 bg-white">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="mb-10">
          <div className="flex space-x-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-cyan-500 shadow-[0_0_10px_cyan]' : 'bg-slate-100'}`}></div>
            ))}
          </div>
          <span className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.3em]">Identity Hub • Step {step} of 3</span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter mt-2">
            {step === 1 ? 'Initialize Identity' : step === 2 ? 'Security Protocol' : 'Identity Ready'}
          </h2>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username / Alias</label>
              <input type="text" placeholder="e.g. satoshi_v" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-slate-900 focus:ring-1 focus:ring-cyan-500 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Communication Channel</label>
              <input type="email" placeholder="verify@example.com" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-slate-900 focus:ring-1 focus:ring-cyan-500 outline-none transition-all" />
            </div>
            <button onClick={() => setStep(2)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-xl">
              Generate Identity
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="p-6 glass-light rounded-2xl border border-cyan-500/20 flex items-center space-x-4">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">Biometric or Hardware Key</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Passkey support enabled</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">Identity verification is conducted client-side using WebAuthn. Your encryption keys never leave this device.</p>
            <div className="flex space-x-4">
              <button onClick={() => setStep(1)} className="flex-1 py-4 glass-light text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Back</button>
              <button onClick={() => setStep(3)} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-600 transition-all">Enable Secure Key</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-8 animate-in slide-in-from-bottom duration-500">
            <div className="w-24 h-24 bg-cyan-500/10 rounded-[2rem] flex items-center justify-center text-cyan-500 mx-auto shadow-2xl">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Welcome to the Network</h3>
               <p className="text-slate-500 mt-2 font-medium">Your Veracity Node has been successfully initialized.</p>
            </div>
            <button onClick={onClose} className="w-full py-5 bg-cyan-600 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-cyan-500/20">
              Enter the Signal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
