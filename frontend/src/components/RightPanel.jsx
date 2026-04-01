import React, { useState, useEffect } from 'react';

export default function RightPanel({ selectedDrone, onSetDestination, onCommand, onSpeedChange, onEmergencyStop, onExport }) {
  const [targetLat, setTargetLat] = useState('');
  const [targetLon, setTargetLon] = useState('');
  const [mode, setMode] = useState('AUTONOMOUS');
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    if (selectedDrone && selectedDrone.telemetry) {
      // Initialize target fields with current if empty or when jumping drones
      // setTargetLat(selectedDrone.telemetry.lat || '');
      // setTargetLon(selectedDrone.telemetry.lon || '');
    }
  }, [selectedDrone]);

  if (!selectedDrone) {
    return (
      <section className="fixed right-0 top-16 w-[360px] h-[calc(100vh-64px)] z-50 bg-[#1E293B]/90 backdrop-blur-md border-l border-slate-700/50 flex flex-col p-6 overflow-y-auto items-center justify-center">
        <h2 className="text-sm font-bold text-slate-500">Select a Drone</h2>
      </section>
    );
  }

  const handleSetTarget = () => {
    const lat = parseFloat(targetLat);
    const lon = parseFloat(targetLon);
    if (!isNaN(lat) && !isNaN(lon)) {
      onSetDestination(selectedDrone.id, lat, lon);
    }
  };

  const handleSpeedChange = (e) => {
    const newSpeed = Number(e.target.value);
    setSpeed(newSpeed);
    if (onSpeedChange) onSpeedChange(selectedDrone.id, newSpeed);
  };

  const altitude = selectedDrone.telemetry?.altitude?.toFixed(2) ?? '0.00';
  const heading = selectedDrone.telemetry?.heading?.toFixed(2) ?? '0.00';
  const lat = selectedDrone.position?.[0]?.toFixed(4) ?? '0.0000';
  const lon = selectedDrone.position?.[1]?.toFixed(4) ?? '0.0000';
  const vel = selectedDrone.telemetry?.velocity?.toFixed(1) ?? '0.0';
  const status = selectedDrone.status || 'UNKNOWN';

  let statusColor = 'text-slate-400 border-slate-700/50 bg-slate-800/50';
  if (status === 'WARNING') statusColor = 'text-error border-error/50 bg-error-container';
  else if (status === 'MOVING') statusColor = 'text-emerald-400 border-emerald-500/50 bg-emerald-900/20';
  else if (status === 'MANUAL') statusColor = 'text-sky-400 border-sky-500/50 bg-sky-900/20';
  else if (status === 'STOPPED') statusColor = 'text-amber-400 border-amber-500/50 bg-amber-900/20';

  return (
    <section className="fixed right-0 top-16 w-[360px] h-[calc(100vh-64px)] z-50 bg-[#1E293B]/90 backdrop-blur-md border-l border-slate-700/50 flex flex-col p-6 overflow-y-auto">
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-outline-variant mb-4">Telemetry & Control - {selectedDrone.name || selectedDrone.id}</h2>

      <div className={`mb-6 p-3 rounded-lg border ${statusColor} flex justify-between items-center`}>
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">System Status</div>
        <div className="font-mono font-black tracking-widest text-sm flex items-center gap-2">
           {status === 'WARNING' && <span className="material-symbols-outlined text-sm animate-pulse">warning</span>}
           {status}
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest/50 p-3 rounded border border-outline-variant/10">
            <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">LATITUDE</div>
            <div className="font-mono text-primary text-sm font-bold tracking-widest">{lat}° N</div>
          </div>
          <div className="bg-surface-container-lowest/50 p-3 rounded border border-outline-variant/10">
            <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">LONGITUDE</div>
            <div className="font-mono text-primary text-sm font-bold tracking-widest">{lon}° W</div>
          </div>
          <div className="bg-surface-container-lowest/50 p-3 rounded border border-outline-variant/10">
            <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">ALTITUDE</div>
            <div className="font-mono text-primary text-sm font-bold tracking-widest">{altitude} m</div>
          </div>
          <div className="bg-surface-container-lowest/50 p-3 rounded border border-outline-variant/10">
            <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">HEADING</div>
            <div className="font-mono text-primary text-sm font-bold tracking-widest">{heading}°</div>
          </div>
        </div>

        <div className="bg-surface-container-lowest/50 p-3 rounded border border-outline-variant/10 flex items-center justify-between">
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">SPEED (m/s)</div>
            <div className="font-mono text-emerald-400 text-lg font-bold tracking-widest">{vel} m/s</div>
          </div>
          <div className="w-16 h-8 bg-surface-container flex items-center justify-center rounded">
            <span className="material-symbols-outlined text-emerald-500">speed</span>
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="mb-8">
        <div className="flex bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/20">
          <button 
            onClick={() => setMode('AUTONOMOUS')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${mode === 'AUTONOMOUS' ? 'bg-primary text-on-primary' : 'text-slate-400 hover:text-white'}`}
          >
            AUTONOMOUS
          </button>
          <button 
            onClick={() => setMode('MANUAL')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${mode === 'MANUAL' ? 'bg-primary text-on-primary' : 'text-slate-400 hover:text-white'}`}
          >
            MANUAL
          </button>
        </div>
      </div>

      {/* Autonomous UI */}
      {mode === 'AUTONOMOUS' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Navigation Target</div>
            <div className="flex flex-col gap-2">
              <input 
                className="bg-surface-container-lowest border border-outline-variant/30 rounded px-3 py-2 text-sm font-mono text-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder-slate-600" 
                placeholder="Target Latitude" 
                type="number"
                step="any"
                value={targetLat}
                onChange={e => setTargetLat(e.target.value)}
              />
              <input 
                className="bg-surface-container-lowest border border-outline-variant/30 rounded px-3 py-2 text-sm font-mono text-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder-slate-600" 
                placeholder="Target Longitude" 
                type="number"
                step="any"
                value={targetLon}
                onChange={e => setTargetLon(e.target.value)}
              />
            </div>
            <button 
              onClick={handleSetTarget}
              className="w-full py-3 bg-primary-container text-on-primary-container font-black text-xs uppercase tracking-widest rounded hover:opacity-90 transition-opacity"
            >
              Set Target Destination
            </button>
          </div>
        </div>
      )}

      {/* Manual UI */}
      {mode === 'MANUAL' && (
        <div className="space-y-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manual D-Pad Override</div>
          
          <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
            <div></div>
            <button onClick={() => onCommand(selectedDrone.id, 'move', { direction: 'up' })} className="w-14 h-14 bg-surface-container border border-outline-variant/30 flex items-center justify-center rounded hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">keyboard_arrow_up</span>
            </button>
            <div></div>
            <button onClick={() => onCommand(selectedDrone.id, 'move', { direction: 'left' })} className="w-14 h-14 bg-surface-container border border-outline-variant/30 flex items-center justify-center rounded hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">keyboard_arrow_left</span>
            </button>
            <button onClick={() => onEmergencyStop()} className="w-14 h-14 bg-error-container border border-error/30 flex items-center justify-center rounded hover:bg-error transition-colors text-error hover:text-on-error">
              <span className="material-symbols-outlined">stop_circle</span>
            </button>
            <button onClick={() => onCommand(selectedDrone.id, 'move', { direction: 'right' })} className="w-14 h-14 bg-surface-container border border-outline-variant/30 flex items-center justify-center rounded hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">keyboard_arrow_right</span>
            </button>
            <div></div>
            <button onClick={() => onCommand(selectedDrone.id, 'move', { direction: 'down' })} className="w-14 h-14 bg-surface-container border border-outline-variant/30 flex items-center justify-center rounded hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">keyboard_arrow_down</span>
            </button>
            <div></div>
          </div>

          <div className="space-y-2 mt-6">
            <div className="flex justify-between text-[10px] font-mono">
              <span>SPEED OVERRIDE</span>
              <span className="text-primary">{speed} m/s</span>
            </div>
            <input 
              className="w-full accent-primary h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer" 
              type="range"
              min="0"
              max="50"
              value={speed}
              onChange={handleSpeedChange}
            />
          </div>
        </div>
      )}

      {/* Bottom Action */}
      <div className="mt-auto pt-8">
        <button onClick={onExport} className="w-full py-4 border border-outline-variant/30 text-slate-400 hover:text-white hover:border-primary transition-all rounded-lg flex items-center justify-center gap-2 text-sm font-bold">
          <span className="material-symbols-outlined shrink-0">download</span>
          Export Telemetry Log
        </button>
      </div>
    </section>
  );
}
