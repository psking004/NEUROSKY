import React, { useState } from 'react';

export default function DeployModal({ isOpen, onClose, onDeploy }) {
  const [droneId, setDroneId] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (droneId && lat && lon) {
      onDeploy({ id: droneId, lat: parseFloat(lat), lon: parseFloat(lon) });
      onClose();
      setDroneId('');
      setLat('');
      setLon('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-surface-container w-full max-w-md p-6 rounded-xl border border-outline-variant/20 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Deploy New Mission</h2>
          <button onClick={onClose} className="text-outline hover:text-white transition-colors">
            <span className="material-symbols-outlined shrink-0">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Drone ID</label>
            <input 
              required
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded px-3 py-2 text-sm font-mono text-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder-slate-600"
              placeholder="e.g. NX-900"
              value={droneId}
              onChange={(e) => setDroneId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Initial Latitude</label>
            <input 
              required
              type="number" step="any"
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded px-3 py-2 text-sm font-mono text-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder-slate-600"
              placeholder="37.7749"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Initial Longitude</label>
            <input 
              required
              type="number" step="any"
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded px-3 py-2 text-sm font-mono text-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder-slate-600"
              placeholder="-122.4194"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
            />
          </div>
          
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold rounded bg-surface hover:bg-surface-bright transition-colors text-slate-300"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-gradient-to-br from-primary-container to-primary text-on-primary font-bold rounded shadow-lg shadow-primary/20 active:opacity-80 transition-all"
            >
              Deploy Drone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
