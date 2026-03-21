import React from 'react';

const Header = () => {
  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 h-16">
      <div className="flex items-center gap-8">
        <span className="text-xl font-black tracking-tighter text-slate-900">NEUROSKY</span>
        <nav className="hidden md:flex gap-6">
          <a className="text-sky-600 border-b-2 border-sky-600 pb-5 font-medium text-sm tracking-tight" href="#">Dashboard</a>
          <a className="text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm tracking-tight" href="#">Missions</a>
          <a className="text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm tracking-tight" href="#">Fleet</a>
          <a className="text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm tracking-tight" href="#">Analytics</a>
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 px-4 py-1.5 bg-surface-container-low rounded-full">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">System Online</span>
          </div>
          <div className="h-4 w-px bg-outline-variant/30"></div>
          <span className="mono-data text-xs font-medium text-primary">12:44:02 UTC</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-500">
            <span className="material-symbols-outlined">sensors</span>
          </button>
          <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-500 relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
          </button>
          <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-500">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="ml-2 w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/20">
            <img alt="Operator Profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYSJXfmgyDO5lljQq8t-B2KoYf1Aj4ZyguctGVac-469Zr629sH4Gr6qvaEPtu5yGqZJBGKE2mERIw_JU8oUW2eYzqqagTAL72MVaGZvvwhczJWQf5gIjxhm8bnpvKGAVU7c4xd56fteN4N2zb4bJ4TvhMcJTgPYaoZ_XLesvNeGhgDNIHFZ9fY08wil-eidrDhcVEouZfh1j1Bx8yPkszXhFR1hLZXb5er26D3d3rISusBF2Gt1c0K0HqC_XtIWiIlVGpw3e_97E"/>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
