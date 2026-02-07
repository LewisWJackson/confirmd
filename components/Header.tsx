
import React, { useState } from 'react';
import { Page } from '../types';
import { AccountModal } from './AccountModal';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-6 md:px-12 py-5 glass border-b border-slate-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-12">
          {/* Playful Logo with icon to the side (right) */}
          <div 
            onClick={() => onNavigate('home')} 
            className="flex items-center cursor-pointer group"
          >
            <div className="order-1">
              <span className="text-2xl font-black logo-text text-slate-900 leading-none tracking-tighter uppercase transition-colors">Confirmd</span>
            </div>
            <div className="w-7 h-7 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[4px_4px_12px_rgba(6,182,212,0.3)] rotate-6 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300 order-2 ml-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-10 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            {['home', 'claims', 'sources', 'blindspot'].map((page) => (
              <button
                key={page}
                onClick={() => onNavigate(page as Page)}
                className={`${currentPage === page ? 'text-cyan-600' : 'hover:text-slate-900'} transition-all flex flex-col items-center`}
              >
                {page === 'home' ? 'Feed' : page === 'claims' ? 'Claims' : page === 'sources' ? 'Sources' : 'Blindspots'}
                {currentPage === page && <div className="w-1 h-1 bg-cyan-600 rounded-full mt-1.5 shadow-[0_0_5px_cyan]"></div>}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-6">
          <div className="relative hidden sm:block">
            <input 
              type="text" 
              placeholder="Search intelligence..." 
              className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-2.5 text-xs font-medium focus:ring-1 focus:ring-cyan-500/50 outline-none w-44 transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <button 
            onClick={() => setIsAccountModalOpen(true)}
            className="bg-slate-900 text-white text-[10px] font-black px-6 py-3 rounded-xl hover:bg-cyan-600 transition-all shadow-xl uppercase tracking-widest"
          >
            Create Account
          </button>
        </div>
      </div>
      
      {isAccountModalOpen && <AccountModal onClose={() => setIsAccountModalOpen(false)} />}
    </header>
  );
};
