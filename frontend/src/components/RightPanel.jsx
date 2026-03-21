import React from 'react';

const RightPanel = ({ isOpen, onClose, selectedDrone, onToggleMode }) => {
  if (!isOpen) return null;

  return (
    <div className={`absolute right-0 top-0 bottom-0 w-[420px] glass-panel border-l border-white/20 shadow-2xl z-30 flex flex-col pt-16 transition-all duration-300 transform translate-x-0`}>
      <div className="p-8 pb-4 flex-1 h-full overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Telemetry Analysis</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-full transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-white/40 rounded-2xl border border-white/60 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 overflow-hidden text-ellipsis whitespace-nowrap w-40">
                {selectedDrone?.id || 'NX-802 Vanguard'}
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                selectedDrone?.mode === 'MANUAL' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
              }`}>
                {selectedDrone?.mode || 'STABLE'}
              </span>
            </div>
            <p className="mono-data text-xs text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap italic">DR-IDENT: {selectedDrone?.id || 'DR-9921-X1A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-left hover:scale-[1.02] transition-transform">
            <span className="material-symbols-outlined text-sky-600 mb-2 text-sm">speed</span>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Airspeed</p>
            <p className="mono-data text-xl font-black text-slate-900">42 <span className="text-xs font-medium text-slate-400">kts</span></p>
          </div>
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-left hover:scale-[1.02] transition-transform">
            <span className="material-symbols-outlined text-secondary mb-2 text-sm">navigation</span>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Heading</p>
            <p className="mono-data text-xl font-black text-slate-900">{Math.round(selectedDrone?.heading || 0)}° <span className="text-xs font-medium text-slate-400">S</span></p>
          </div>
          <div className="col-span-2 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-left hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-sm">battery_charging_80</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Battery Status</p>
              </div>
              <p className="mono-data text-sm font-bold text-emerald-600">{selectedDrone?.battery || 88}%</p>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                style={{ width: `${selectedDrone?.battery || 88}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic px-1">Remaining operational time: <span className="font-bold">24m 12s</span></p>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Telemetry Stream</h4>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex gap-4 p-2 bg-slate-50 rounded-lg border border-slate-100 text-left text-[10px] font-medium font-mono group">
              <span className="text-sky-600 font-bold whitespace-nowrap">12:44:02</span>
              <span className="text-slate-600 uppercase group-hover:text-primary transition-colors">POS_UPDATE: {selectedDrone?.lat?.toFixed(4)}, {selectedDrone?.lng?.toFixed(4)}</span>
            </div>
            <div className="flex gap-4 p-2 bg-slate-50 rounded-lg border border-slate-100 text-left text-[10px] font-medium font-mono group">
              <span className="text-sky-600 font-bold whitespace-nowrap">12:43:58</span>
              <span className="text-slate-600 uppercase group-hover:text-primary transition-colors">ALT_CORRECT: {selectedDrone?.alt}m adjustment</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-8 pt-4 bg-slate-50/50 border-t border-slate-100">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-3 block">Navigation Override</label>
        <div className="flex gap-3">
          <button 
            onClick={() => onToggleMode(selectedDrone?.id)}
            className={`flex-1 ${
              selectedDrone?.mode === 'MANUAL' ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white'
            } py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] shadow-lg active:scale-95 transition-all`}
          >
            <span className="material-symbols-outlined text-sm">{selectedDrone?.mode === 'MANUAL' ? 'pan_tool_alt' : 'settings_remote'}</span>
            {selectedDrone?.mode === 'MANUAL' ? 'MANUAL CONTROL' : 'SWITCH TO MANUAL'}
          </button>
          <button className="p-4 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-lg active:scale-95 border border-rose-100">
            <span className="material-symbols-outlined text-sm">warning</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
