import React from 'react';
import MapView from './MapView';

const MapLayout = ({ drones, onDroneSelect }) => {
  return (
    <main className="ml-80 pt-16 h-screen relative bg-slate-200 overflow-hidden">
      {/* REAL MAP INTEGRATION */}
      <div className="absolute inset-0 bg-[#e5e7eb] overflow-hidden">
        <MapView drones={drones} onDroneClick={onDroneSelect} />
      </div>

      {/* FLOATING UI HUD (EXACT MATCH) */}
      <div className="absolute bottom-8 left-8 flex gap-4 z-20">
        <div className="glass-panel p-4 rounded-2xl border border-white/40 shadow-2xl flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Global Density</span>
            <span className="text-xl font-black text-slate-900 leading-none">84%</span>
          </div>
          <div className="w-px h-8 bg-slate-300"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Active Paths</span>
            <span className="text-xl font-black text-slate-900 leading-none">1,204</span>
          </div>
          <div className="w-px h-8 bg-slate-300"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Collision Risk</span>
            <span className="text-xl font-black text-emerald-600 leading-none uppercase">Low</span>
          </div>
        </div>
        <div className="glass-panel p-2 rounded-2xl border border-white/40 shadow-2xl flex flex-col gap-1">
          <button className="p-2 hover:bg-white rounded-lg transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-700 text-sm">add</span>
          </button>
          <div className="h-px bg-slate-200 mx-1"></div>
          <button className="p-2 hover:bg-white rounded-lg transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-700 text-sm">remove</span>
          </button>
        </div>
      </div>
    </main>
  );
};

export default MapLayout;
