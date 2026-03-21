import React, { useState } from 'react';

const DeployModal = ({ isOpen, onClose, onDeploy }) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: `NX-${Math.floor(100 + Math.random() * 900)}`,
    lat: 37.7749,
    lng: -122.4194
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onDeploy({
      id: formData.name,
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng),
      alt: 120,
      heading: 0,
      battery: 100,
      mode: 'AUTO'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Deploy New Mission</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Asset Designation</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
              placeholder="e.g. VANGUARD-01"
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Launch Latitude</label>
              <input 
                type="number" step="0.000001"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all mono-data text-sm font-bold"
                value={formData.lat} 
                onChange={e => setFormData({ ...formData, lat: e.target.value })} 
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Launch Longitude</label>
              <input 
                type="number" step="0.000001"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all mono-data text-sm font-bold"
                value={formData.lng} 
                onChange={e => setFormData({ ...formData, lng: e.target.value })} 
                required
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              className="px-6 py-3.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
              onClick={onClose}
            >
              CANCEL
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-sky-100 hover:scale-[1.02] active:scale-95 transition-all"
            >
              INITIATE LAUNCH
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeployModal;
