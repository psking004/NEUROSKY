import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainMap from './components/MainMap';
import RightPanel from './components/RightPanel';
import DeployModal from './components/DeployModal';

function App() {
  const [drones, setDrones] = useState([
    {
      id: "SIGMA-ALPHA-1",
      lat: 37.7749,
      lng: -122.4194,
      alt: 120,
      heading: 90,
      battery: 100,
      mode: 'AUTO'
    }
  ]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedDroneId, setSelectedDroneId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  const selectedDrone = drones.find(d => d.id === selectedDroneId);

  useEffect(() => {
    const s = io('http://localhost:3000');
    setSocket(s);

    s.on('connect', () => {
      setConnected(true);
      s.emit('join_dashboard');
    });

    s.on('global_sync', (data) => {
      setDrones(prev => {
        const index = prev.findIndex(d => d.id === data.droneId);
        const updatedDrone = { ...data.position, id: data.droneId, mode: prev[index]?.mode || 'AUTO' };
        
        if (index !== -1) {
          const newDrones = [...prev];
          newDrones[index] = updatedDrone;
          return newDrones;
        }
        return [...prev, updatedDrone];
      });
    });

    s.on('disconnect', () => setConnected(false));

    return () => s.disconnect();
  }, []);

  const handleManualDeploy = useCallback((newDrone) => {
    setDrones(prev => [...prev, newDrone]);
    if (socket) {
      socket.emit('drone_telemetry', {
        droneId: newDrone.id,
        ...newDrone
      });
    }
  }, [socket]);

  const handleDroneSelect = (drone) => {
    setSelectedDroneId(drone.id);
    setIsPanelOpen(true);
  };

  const toggleMode = (droneId) => {
    setDrones(prev => prev.map(d => {
      if (d.id === droneId) {
        return { ...d, mode: d.mode === 'AUTO' ? 'MANUAL' : 'AUTO' };
      }
      return d;
    }));
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#fbf8ff] font-body text-on-surface">
      
      {/* 1. LAYER - FIXED HUD HEADER */}
      <Header connected={connected} />

      {/* 2. LAYER - WORKSPACE LAYOUT */}
      <div className="flex h-full w-full relative">
        
        {/* SIDEBAR: ASSET REGISTRY */}
        <Sidebar 
          drones={drones} 
          onOpenDeploy={() => setIsModalOpen(true)} 
          onSelectDrone={handleDroneSelect}
          selectedDroneId={selectedDroneId}
        />

        {/* MAIN: LIVE TELEMETRY RADAR */}
        <MainMap 
          drones={drones} 
          onDroneSelect={handleDroneSelect}
        />

        {/* FLOAT-RIGHT TELEMETRY PANEL */}
        <RightPanel 
          isOpen={isPanelOpen} 
          onClose={() => setIsPanelOpen(false)} 
          selectedDrone={selectedDrone}
          onToggleMode={toggleMode}
        />

      </div>

      {/* CONTEXTUAL MISSION FAB (Positioned as per Design) */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className={`fixed bottom-8 ${isPanelOpen ? 'right-[440px]' : 'right-8'} w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[60] outline-none border-none`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>

      {/* DEPLOY MISSION MODAL OVERLAY */}
      <DeployModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onDeploy={handleManualDeploy} 
      />

    </div>
  );
}

export default App;
