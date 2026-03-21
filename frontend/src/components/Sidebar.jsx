import React from 'react';

const Sidebar = ({ drones = [], onOpenDeploy, onSelectDrone, selectedDroneId }) => {
  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col p-4 pt-20 w-80 bg-slate-50 border-r border-slate-200 z-40">
      <div className="mb-6">
        <button 
          onClick={onOpenDeploy}
          className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-200 active:scale-95 transition-all outline-none border-none"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
          DEPLOY MISSION
        </button>
      </div>
      <div className="flex flex-col gap-1 mb-8">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Main Control</span>
        </div>
        <a className="flex items-center gap-3 p-3 bg-white text-sky-600 shadow-sm rounded-lg font-bold translate-x-1" href="#">
          <span className="material-symbols-outlined">map</span>
          <span className="text-sm">Live Map</span>
        </a>
        <a className="flex items-center gap-3 p-3 text-slate-500 hover:bg-slate-100 rounded-lg transition-transform duration-200 hover:translate-x-1" href="#">
          <span className="material-symbols-outlined">navigation</span>
          <span className="text-sm">Flight Logs</span>
        </a>
        <a className="flex items-center gap-3 p-3 text-slate-500 hover:bg-slate-100 rounded-lg transition-transform duration-200 hover:translate-x-1" href="#">
          <span className="material-symbols-outlined">precision_manufacturing</span>
          <span className="text-sm">Drone Registry</span>
        </a>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar h-full">
        <div className="flex items-center justify-between px-2 mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Assets ({drones.length})</span>
          <span className="material-symbols-outlined text-slate-400 text-sm cursor-pointer">filter_list</span>
        </div>
        <div className="space-y-3">
          {drones.map((d) => (
            <div 
              key={d.id}
              onClick={() => onSelectDrone(d)}
              className={`p-3 rounded-xl shadow-sm border transition-all duration-200 cursor-pointer group ${
                selectedDroneId === d.id 
                  ? 'bg-sky-50 border-sky-400 shadow-md translate-x-1' 
                  : 'bg-white border-transparent hover:border-sky-200 hover:translate-x-1'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${
                    selectedDroneId === d.id ? 'text-sky-600' : 'text-primary'
                  }`}>airplanemode_active</span>
                  <span className="mono-data text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis w-24">#{d.id.slice(0, 10)}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  selectedDroneId === d.id ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-700'
                }`}>IN_FLIGHT</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-1.5 rounded-lg text-center">
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">ALTITUDE</p>
                  <p className="mono-data text-[10px] text-slate-700 font-bold">{d.alt}m</p>
                </div>
                <div className="bg-slate-50 p-1.5 rounded-lg text-center">
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">BATTERY</p>
                  <p className="mono-data text-[10px] text-emerald-600 font-bold">{d.battery}%</p>
                </div>
              </div>
            </div>
          ))}
          {drones.length === 0 && (
            <div className="p-8 text-center opacity-30 italic text-sm">No active assets.</div>
          )}
        </div>
      </div>
      <div className="pt-4 border-t border-slate-200 flex flex-col gap-1">
        <a className="flex items-center gap-3 p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all text-sm" href="#">
          <span className="material-symbols-outlined text-sm">help</span>
          Support
        </a>
        <a className="flex items-center gap-3 p-2 text-slate-400 hover:bg-error/5 hover:text-error rounded-lg transition-all text-sm" href="#">
          <span className="material-symbols-outlined text-sm">logout</span>
          Logout
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
