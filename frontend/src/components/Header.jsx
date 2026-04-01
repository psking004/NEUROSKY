import React from 'react';

export default function Header({ fleetCount = 0, activeTab = 'fleet', onTabChange = () => {} }) {
  return (
    <header className="fixed top-0 w-full h-16 z-50 bg-[#131b2e] flex items-center justify-between px-6 border-none">
      <div className="flex items-center gap-8">
        <span className="text-xl font-black tracking-tighter text-sky-400">NeuroSky DTM</span>
        <nav className="hidden md:flex items-center gap-6">
          <button onClick={() => onTabChange('fleet')} className={`${activeTab === 'fleet' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'} pb-1 text-sm font-medium transition-colors bg-transparent cursor-pointer`}>Fleet</button>
          <button onClick={() => onTabChange('missions')} className={`${activeTab === 'missions' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'} pb-1 text-sm font-medium transition-colors bg-transparent cursor-pointer`}>Missions</button>
          <button onClick={() => onTabChange('analytics')} className={`${activeTab === 'analytics' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'} pb-1 text-sm font-medium transition-colors bg-transparent cursor-pointer`}>Analytics</button>
          <button onClick={() => onTabChange('logs')} className={`${activeTab === 'logs' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'} pb-1 text-sm font-medium transition-colors bg-transparent cursor-pointer`}>Logs</button>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 px-4 py-1.5 bg-surface-container rounded-lg border border-outline-variant/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[10px] tracking-wider text-emerald-500 uppercase">CONNECTED</span>
          </div>
          <div className="h-4 w-px bg-outline-variant/30"></div>
          <div className="font-mono text-[10px] tracking-wider text-on-surface-variant">FLEET COUNT: {fleetCount}</div>
          <div className="h-4 w-px bg-outline-variant/30"></div>
          <div className="font-mono text-[10px] tracking-wider text-on-surface-variant">UTC LIVE</div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:bg-white/5 rounded-full transition-all flex items-center justify-center">
            <span className="material-symbols-outlined">sensors</span>
          </button>
          <button className="p-2 text-slate-400 hover:bg-white/5 rounded-full transition-all flex items-center justify-center">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button className="p-2 text-slate-400 hover:bg-white/5 rounded-full transition-all flex items-center justify-center">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  );
}
