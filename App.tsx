
import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { NewsCard } from './components/NewsCard';
import { BlindspotWidget } from './components/BlindspotWidget';
import { VeracityAnalysis } from './components/VeracityAnalysis';
import { StoryDetail } from './components/StoryDetail';
import { GridBackground } from './components/GridBackground';
import { ClaimCard } from './components/ClaimCard';
import { ClaimDetail } from './components/ClaimDetail';
import { SourceScoreCard } from './components/SourceScoreCard';
import { MOCK_STORIES, SIDEBAR_TOPICS, MOCK_CLAIMS, CREDIBILITY_SOURCES } from './constants';
import { Page, Claim, VerdictLabel } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<'latest' | 'trusted' | 'original'>('latest');
  const [claimFilter, setClaimFilter] = useState<'all' | 'verified' | 'speculative' | 'resolved'>('all');

  const selectedStory = useMemo(() =>
    MOCK_STORIES.find(s => s.id === selectedStoryId),
    [selectedStoryId]
  );

  const selectedClaim = useMemo(() =>
    MOCK_CLAIMS.find(c => c.id === selectedClaimId),
    [selectedClaimId]
  );

  const filteredClaims = useMemo(() => {
    if (claimFilter === 'verified') {
      return MOCK_CLAIMS.filter(c => c.verdict?.verdictLabel === 'verified');
    }
    if (claimFilter === 'speculative') {
      return MOCK_CLAIMS.filter(c => c.verdict?.verdictLabel === 'speculative' || c.verdict?.verdictLabel === 'misleading');
    }
    if (claimFilter === 'resolved') {
      return MOCK_CLAIMS.filter(c => c.status === 'resolved');
    }
    return MOCK_CLAIMS;
  }, [claimFilter]);

  const sourcesArray = useMemo(() => Object.values(CREDIBILITY_SOURCES), []);

  const filteredStories = useMemo(() => {
    if (feedFilter === 'trusted') {
      return MOCK_STORIES.filter(s => s.veracity.verified > 60);
    }
    if (feedFilter === 'original') {
      return MOCK_STORIES.filter(s => s.isSynthesized);
    }
    return MOCK_STORIES;
  }, [feedFilter]);

  const navigateToStory = (id: string) => {
    setSelectedStoryId(id);
    setCurrentPage('story');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToClaim = (id: string) => {
    setSelectedClaimId(id);
    setCurrentPage('claims');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderHome = () => {
    const featuredStory = filteredStories.find(s => s.isSynthesized) || filteredStories[0];
    const blindspotStory = MOCK_STORIES.find(s => s.isBlindspot) || MOCK_STORIES[1];
    const rest = filteredStories.filter(s => s.id !== featuredStory.id);

    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 w-full animate-in fade-in duration-1000 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-20">
            <section>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black tracking-[0.5em] text-cyan-600 uppercase mb-3">Verified Stream</span>
                  <h2 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">Intelligence Feed</h2>
                </div>
                <div className="flex space-x-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm relative">
                   <button 
                    onClick={() => setFeedFilter('latest')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feedFilter === 'latest' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                   >
                    Latest
                   </button>
                   <button 
                    onClick={() => setFeedFilter('trusted')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feedFilter === 'trusted' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                   >
                    Trusted
                   </button>
                   <div className="relative group/filter">
                    <button 
                      onClick={() => setFeedFilter('original')}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feedFilter === 'original' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      Confirmd Original
                    </button>
                    {/* Improved badge positioning and aesthetics */}
                    <span className="absolute -top-4 -right-2 px-2 py-0.5 bg-cyan-500 text-[7px] text-white rounded-full font-black shadow-md border border-white uppercase tracking-tighter pointer-events-none">Membership</span>
                   </div>
                </div>
              </div>
              
              {feedFilter === 'original' ? (
                <div className="glass rounded-[3rem] p-20 text-center border-dashed border-2 border-slate-200 bg-white/50">
                  <div className="w-20 h-20 bg-cyan-100 rounded-3xl flex items-center justify-center text-cyan-600 mx-auto mb-8 shadow-xl">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Access Confirmd Original</h3>
                  <p className="text-slate-500 mt-4 max-w-md mx-auto font-medium">Synthesized, noise-free original reports. Unlock the full data synthesis for members.</p>
                  <button className="mt-10 px-10 py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-cyan-600 transition-all">Start Membership</button>
                </div>
              ) : (
                <>
                  <div onClick={() => navigateToStory(featuredStory.id)}>
                    <NewsCard story={featuredStory} variant="featured" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-20">
                    {rest.map(story => (
                      <div key={story.id} onClick={() => navigateToStory(story.id)}>
                        <NewsCard story={story} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="glass rounded-[3rem] p-12 relative overflow-hidden group bg-white/50 border-slate-100">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-transparent to-orange-500"></div>
               <div className="flex items-center justify-between mb-12">
                 <h3 className="text-3xl font-black tracking-tighter uppercase text-slate-900">Anomaly Scanner</h3>
                 <div className="flex items-center space-x-2">
                   <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Pulse</span>
                 </div>
               </div>
               <div className="space-y-8">
                  {MOCK_STORIES.filter(s => s.veracity.speculative > 50).map(s => (
                    <div 
                      key={`signal-${s.id}`} 
                      onClick={() => navigateToStory(s.id)}
                      className="glass-light hover:bg-slate-50 p-8 rounded-[2rem] flex items-center justify-between hover:shadow-2xl transition-all duration-500 cursor-pointer border border-transparent hover:border-orange-500/20 group/item"
                    >
                      <div className="flex-1">
                        <span className="text-[10px] font-black text-orange-600 tracking-widest uppercase mb-2 block">High Noise Amplitude</span>
                        <h4 className="font-black text-xl text-slate-800 group-hover/item:text-cyan-600 transition-colors tracking-tight">{s.title}</h4>
                      </div>
                      <div className="ml-8 w-20 h-20 rounded-2xl bg-white flex flex-col items-center justify-center border border-orange-100 shadow-xl">
                        <span className="text-2xl font-black text-orange-600">{s.veracity.speculative}%</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">NOISE</span>
                      </div>
                    </div>
                  ))}
               </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-16">
            <BlindspotWidget story={blindspotStory} />
            
            <section className="glass rounded-[2.5rem] p-10 shadow-xl border border-slate-100 bg-white/50">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="font-black text-xs tracking-[0.3em] text-slate-400 uppercase">Protocol Status</h3>
                  <div className="px-3 py-1 bg-cyan-500/10 text-cyan-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-cyan-500/20">Active</div>
                </div>
                <div className="space-y-10">
                  {SIDEBAR_TOPICS.map(topic => (
                    <div key={topic.id} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center">
                         <div className={`w-2 h-2 rounded-full mr-5 ${topic.trend === 'up' ? 'bg-cyan-500 shadow-[0_0_8px_cyan]' : topic.trend === 'down' ? 'bg-orange-500' : 'bg-slate-400'}`}></div>
                         <span className="text-sm font-black text-slate-700 group-hover:text-cyan-600 transition-colors uppercase tracking-tight">{topic.name}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase leading-none mb-1">Index</span>
                        <span className="text-xs font-black text-slate-900">82.4</span>
                      </div>
                    </div>
                  ))}
                </div>
            </section>

            <VeracityAnalysis />
          </div>
        </div>
      </div>
    );
  };

  const renderClaims = () => {
    if (selectedClaimId && selectedClaim) {
      return (
        <ClaimDetail
          claim={selectedClaim}
          onBack={() => setSelectedClaimId(null)}
        />
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 w-full animate-in fade-in duration-1000 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-[0.5em] text-cyan-600 uppercase mb-3">Verified Claims</span>
            <h2 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">Claim Tracker</h2>
          </div>
          <div className="flex space-x-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            {(['all', 'verified', 'speculative', 'resolved'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setClaimFilter(filter)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  claimFilter === filter
                    ? filter === 'verified' ? 'bg-cyan-500 text-white shadow-lg' :
                      filter === 'speculative' ? 'bg-orange-500 text-white shadow-lg' :
                      'bg-white text-slate-900 shadow-lg'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredClaims.map(claim => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              onClick={() => navigateToClaim(claim.id)}
            />
          ))}
        </div>

        {filteredClaims.length === 0 && (
          <div className="glass rounded-[3rem] p-20 text-center border-dashed border-2 border-slate-200 bg-white/50">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">No Claims Found</h3>
            <p className="text-slate-500 mt-4 max-w-md mx-auto font-medium">No claims match the current filter criteria.</p>
          </div>
        )}
      </div>
    );
  };

  const renderSources = () => {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 w-full animate-in fade-in duration-1000 relative z-10">
        <div className="flex flex-col mb-12">
          <span className="text-[10px] font-black tracking-[0.5em] text-cyan-600 uppercase mb-3">Source Intelligence</span>
          <h2 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">Credibility Directory</h2>
          <p className="text-slate-500 mt-4 max-w-2xl font-medium">
            Source scores derived from historical claim accuracy using Bayesian shrinkage methodology. Track record represents verified claim ratio; method discipline measures evidence quality standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sourcesArray
            .sort((a, b) => b.score.trackRecord - a.score.trackRecord)
            .map(source => (
              <SourceScoreCard
                key={source.id}
                source={source}
              />
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col relative transition-colors duration-500 bg-white">
      <GridBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          currentPage={currentPage} 
          onNavigate={setCurrentPage} 
        />
        
        <main className="flex-1">
          {currentPage === 'home' && renderHome()}
          {currentPage === 'claims' && renderClaims()}
          {currentPage === 'sources' && renderSources()}
          {currentPage === 'story' && selectedStory && (
            <StoryDetail
              story={selectedStory}
              onBack={() => {
                setCurrentPage('home');
                setSelectedStoryId(null);
              }}
            />
          )}
        </main>

        <footer className="bg-slate-900 text-slate-400 py-32 px-6 md:px-12 z-20 border-t border-slate-800 mt-auto">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-24 mb-32">
               <div className="col-span-1 md:col-span-1 space-y-12">
                  <div className="flex items-center group cursor-pointer">
                    <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-5 flex flex-col leading-none">
                      <span className="text-2xl font-black text-white uppercase tracking-tighter">Confirmd</span>
                    </div>
                  </div>
                  <p className="text-lg font-medium leading-relaxed text-slate-400 max-w-sm">
                    Verified signal detection for the decentralized era. Filter the noise, find the truth.
                  </p>
               </div>
            </div>
            <div className="border-t border-slate-800 pt-16 flex flex-col md:flex-row justify-between items-center text-[10px] font-black tracking-[0.5em] uppercase opacity-50">
               <span>© 2024 CONFIRMD DATA SYSTEMS</span>
               <div className="flex space-x-16 mt-8 md:mt-0">
                 <span className="text-cyan-500">Verified System</span>
                 <span className="text-slate-700">Ping: 7ms</span>
               </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
