import React from 'react';

export default function Sidebar({ drones = [], selectedDroneId, onSelectDrone, onDeployClick }) {
  return (
    <aside className="fixed left-0 top-16 w-[320px] h-[calc(100vh-64px)] z-40 bg-[#131b2e] flex flex-col py-4 border-none">
      <div className="px-4 mb-6">
        <button 
          onClick={onDeployClick}
          className="w-full py-3 bg-gradient-to-br from-primary-container to-primary text-on-primary font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:opacity-80 transition-all"
        >
          <span className="material-symbols-outlined shrink-0">flight_takeoff</span>
          Deploy Mission
        </button>
      </div>

      <div className="px-4 mb-4 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-outline">Active Fleet</h2>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-surface-container-high rounded text-sky-400">LIVE FEED</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {drones.map(drone => {
          const isActive = drone.id === selectedDroneId;
          const bgClass = isActive 
            ? 'bg-[#222a3d] text-sky-400 border-l-4 border-sky-400 p-4 rounded-r-lg group cursor-pointer transition-all duration-200'
            : 'bg-surface-container hover:bg-[#171f33] p-4 rounded-lg transition-colors group cursor-pointer';

          let stateColor = 'text-sky-400';
          let stateBg = 'bg-sky-400/20';
          if (drone.status === 'HOLDING' || drone.status === 'IDLE') {
            stateColor = 'text-amber-400';
            stateBg = 'bg-amber-400/20';
          } else if (drone.status === 'EMERGENCY' || drone.status === 'CRITICAL' || drone.status === 'ERROR') {
            stateColor = 'text-error';
            stateBg = 'bg-error/20';
          }

          const alt = drone.telemetry?.altitude ?? 0;
          const vel = drone.telemetry?.velocity ?? 0;
          const hdg = drone.telemetry?.heading ?? 0;
          const bat = drone.telemetry?.battery ?? 100;

          return (
            <div 
              key={drone.id} 
              className={bgClass}
              onClick={() => onSelectDrone(drone.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`font-mono font-bold text-sm tracking-tight ${isActive ? '' : 'text-slate-200'}`}>{drone.name || drone.id}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 ${stateBg} ${stateColor} rounded`}>
                  {drone.status || 'IN FLIGHT'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-1 font-mono text-[10px] text-slate-400">
                <div>ALT: <span className={drone.status === 'EMERGENCY' ? 'text-error' : 'text-on-background'}>{Math.round(alt)}m</span></div>
                <div>VEL: <span className={drone.status === 'EMERGENCY' ? 'text-error' : 'text-on-background'}>{Math.round(vel)}km/h</span></div>
                <div>HDG: <span className="text-on-background">{Math.round(hdg)}°</span></div>
                <div>BAT: <span className={bat < 20 ? 'text-error' : (bat < 50 ? 'text-amber-400' : 'text-emerald-400')}>{Math.round(bat)}%</span></div>
              </div>
            </div>
          );
        })}
        {drones.length === 0 && (
          <div className="text-center text-xs text-slate-500 font-mono mt-8">No active drones</div>
        )}
      </div>

      <div className="mt-auto px-4 py-4 space-y-2">
        <button className="w-full px-4 py-3 flex items-center gap-3 text-error bg-error/5 hover:bg-error/10 transition-colors rounded-lg group justify-center">
          <span className="material-symbols-outlined shrink-0">cancel</span>
          <span className="text-sm font-bold">Emergency Stop</span>
        </button>
      </div>
    </aside>
  );
}
