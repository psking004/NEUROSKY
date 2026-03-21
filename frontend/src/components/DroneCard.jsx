import React from 'react';

const DroneCard = ({ drone, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(drone)}
      className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-transparent hover:border-sky-200 transition-colors cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">airplanemode_active</span>
          <span className="mono-data text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis w-24">
            #{drone.id.slice(0, 10)}
          </span>
        </div>
        <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">IN_FLIGHT</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 p-1.5 rounded-lg text-center">
          <p className="text-[9px] text-slate-400 uppercase font-bold">ALT</p>
          <p className="mono-data text-[10px] text-slate-700 font-bold">{drone.alt}m</p>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-lg text-center">
          <p className="text-[9px] text-slate-400 uppercase font-bold">BAT</p>
          <p className={`mono-data text-[10px] font-bold ${drone.battery < 20 ? 'text-amber-500' : 'text-emerald-600'}`}>
            {drone.battery}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default DroneCard;
