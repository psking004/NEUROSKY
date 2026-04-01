import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainMap from './components/MainMap';
import RightPanel from './components/RightPanel';
import DeployModal from './components/DeployModal';

const SOCKET_URL = 'http://localhost:3000';

export const NO_FLY_ZONES = [
  { id: 'nfz-gov', center: [37.7749, -122.4294], radius: 300, name: 'Gov Exclusion Zone' },
  { id: 'nfz-air', center: [37.7849, -122.4094], radius: 200, name: 'SFO Airspace' }
];

export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const m1 = lat1 * Math.PI/180;
  const m2 = lat2 * Math.PI/180;
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLon = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(m1) * Math.cos(m2) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export const parseGPS = (val) => Math.abs(val) > 180 ? val / 1e7 : val;

function App() {
  const [socket, setSocket] = useState(null);
  const [drones, setDrones] = useState([]);
  const [selectedDroneId, setSelectedDroneId] = useState(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("fleet");
  const [logs, setLogs] = useState([{ time: Date.now(), msg: 'System Initialized' }]);
  
  const dronesRef = useRef([]);

  const addLog = (msg) => {
    setLogs(prev => [{ time: Date.now(), msg }, ...prev].slice(0, 100));
  };

  useEffect(() => {
    dronesRef.current = drones;
  }, [drones]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      console.log('Connected to backend');
      addLog('Connected to Central Simulation Server');
    });

    newSocket.on('drones:update', (data) => {
      if (!data || !data.drones) return;

      const currentDrones = dronesRef.current;
      const newLogs = [];

      // Pre-process warnings to emit logs and auto-stop safely
      data.drones.forEach(d => {
        const dLat = parseGPS(d.latitude);
        const dLon = parseGPS(d.longitude);
        
        const isColliding = data.drones.some(o => {
          if (o.id === d.id) return false;
          return getDistance(dLat, dLon, parseGPS(o.latitude), parseGPS(o.longitude)) < 50;
        });
        const inNFZ = NO_FLY_ZONES.some(z => getDistance(dLat, dLon, z.center[0], z.center[1]) < z.radius);
        
        if (isColliding || inNFZ) {
          const existing = currentDrones.find(x => x.id === d.id);
          if (!existing || existing.status !== 'WARNING') {
            const reason = isColliding ? 'PROXIMITY COLLISION WARNING' : 'NO-FLY ZONE BREACH';
            newLogs.push(`WARNING [${d.id}]: ${reason}`);
            // AUTO MODE: Force emergency stop on rules breach
            newSocket.emit('drone:control', { droneId: d.id, command: { speed: 0 } });
          }
        }
      });

      if (newLogs.length > 0) {
        setLogs(prev => [...newLogs.map(msg => ({ time: Date.now(), msg })), ...prev].slice(0, 100));
      }

      setDrones(prev => {
        const newDrones = [...prev];
        let structuralChange = false;

        data.drones.forEach(d => {
          const dLat = parseGPS(d.latitude);
          const dLon = parseGPS(d.longitude);

          const isColliding = data.drones.some(o => {
            if (o.id === d.id) return false;
            return getDistance(dLat, dLon, parseGPS(o.latitude), parseGPS(o.longitude)) < 50;
          });
          const inNFZ = NO_FLY_ZONES.some(z => getDistance(dLat, dLon, z.center[0], z.center[1]) < z.radius);
          
          let status = 'IDLE';
          if (isColliding || inNFZ) {
            status = 'WARNING';
          } else if (d.speed > 0) {
            status = 'MOVING';
          } else if (d.speed === 0 && d.mode === 'manual') {
            status = 'MANUAL';
          } else {
            status = 'STOPPED';
          }

          const existingIndex = newDrones.findIndex(pd => pd.id === d.id);
          const newTarget = [dLat, dLon];
          
          if (existingIndex >= 0) {
            const prevD = newDrones[existingIndex];
            
            if (
              prevD.status !== status ||
              Math.abs(prevD.target[0] - newTarget[0]) > 0.000001 ||
              Math.abs(prevD.target[1] - newTarget[1]) > 0.000001 ||
              prevD.telemetry.altitude !== d.altitude ||
              prevD.telemetry.heading !== d.heading ||
              prevD.telemetry.velocity !== d.speed ||
              JSON.stringify(prevD.destination) !== JSON.stringify(d.target)
            ) {
              newDrones[existingIndex] = {
                ...prevD,
                status,
                target: newTarget, 
                destination: d.target, // Nav destination
                telemetry: {
                  ...prevD.telemetry,
                  altitude: d.altitude,
                  heading: d.heading,
                  velocity: d.speed
                }
              };
              structuralChange = true;
            }
          } else {
            newDrones.push({
              id: d.id,
              name: d.name,
              status,
              position: [dLat, dLon],
              target: [dLat, dLon],
              destination: d.target,
              telemetry: {
                altitude: d.altitude,
                heading: d.heading,
                velocity: d.speed,
                battery: 100 
              }
            });
            structuralChange = true;
          }
        });

        if (newDrones.length > data.drones.length) {
          const backendIds = new Set(data.drones.map(d => d.id));
          structuralChange = true;
          return newDrones.filter(d => backendIds.has(d.id));
        }

        return structuralChange ? newDrones : prev;
      });
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const selectedDrone = drones.find(d => d.id === selectedDroneId);

  const handleDeployDrone = (formData) => {
    if (socket) {
      addLog(`DEPLOY: Drone ${formData.id} requested at coordinates ${formData.lat}, ${formData.lon}`);
      socket.emit('drone:add', {
        name: formData.id,
        latitude: formData.lat,
        longitude: formData.lon,
        speed: 0
      });
    }
  };

  const handleSetDestination = (droneId, lat, lon) => {
    if (socket) {
      addLog(`NAVIGATION: New waypoint set for ${droneId} to [${lat.toFixed(4)}, ${lon.toFixed(4)}]`);
      setDrones(prev =>
        prev.map(drone =>
          drone.id === droneId
            ? { ...drone, target: [lat, lon] }
            : drone
        )
      );

      socket.emit('drone:setTarget', {
        droneId,
        latitude: lat,
        longitude: lon
      });
    }
  };

  const handleCommand = (droneId, action, options = {}) => {
    if (socket) {
      if (action === 'stop') addLog(`MANUAL: Stop sequence sent to ${droneId}`);
      if (action === 'move') addLog(`MANUAL: Override direction ${options.direction} sent to ${droneId}`);
      socket.emit('drone:control', {
        droneId,
        command: {
          action: action,
          direction: options.direction,
          mode: 'manual'
        }
      });
    }
  };

  const handleSpeedChange = (droneId, speed) => {
    if (socket) {
      socket.emit('drone:control', {
        droneId,
        command: {
          speed: speed
        }
      });
    }
  };

  const updateDroneTarget = (lat, lng) => {
    if (!selectedDroneId) return;
    
    setDrones(prev =>
      prev.map(drone =>
        drone.id === selectedDroneId
          ? { ...drone, target: [lat, lng] }
          : drone
      )
    );

    addLog(`NAVIGATION: New waypoint set for ${selectedDroneId} to [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
    handleSetDestination(selectedDroneId, lat, lng);
  };

  const handleEmergencyStop = () => {
    if (!selectedDroneId || !socket) return;
    
    addLog(`EMERGENCY OVERRIDE: Global halt sent for ${selectedDroneId}`);
    socket.emit("emergency_stop", { droneId: selectedDroneId });

    setDrones(prev =>
      prev.map(d =>
        d.id === selectedDroneId
          ? { ...d, target: null, destination: null }
          : d
      )
    );
  };

  const handleExport = () => {
    const data = JSON.stringify(drones, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "telemetry.json";
    a.click();
    addLog('SYSTEM: Telemetry log successfully exported via portal');
  };

  return (
    <div className="flex flex-col h-full w-full">
      <Header fleetCount={drones.length} activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 flex flex-row mt-16 overflow-hidden relative">
        {activeTab === "fleet" && (
          <>
            <Sidebar 
              drones={drones} 
              selectedDroneId={selectedDroneId}
              onSelectDrone={setSelectedDroneId}
              onDeployClick={() => setIsDeployModalOpen(true)}
            />
            <MainMap 
              drones={drones} 
              selectedDroneId={selectedDroneId}
              onSelectDrone={setSelectedDroneId}
              onMapClick={updateDroneTarget}
              noFlyZones={NO_FLY_ZONES}
            />
            <RightPanel 
              selectedDrone={selectedDrone}
              onSetDestination={handleSetDestination}
              onCommand={handleCommand}
              onSpeedChange={handleSpeedChange}
              onEmergencyStop={handleEmergencyStop}
              onExport={handleExport}
            />
          </>
        )}
        {activeTab === "missions" && <Missions />}
        {activeTab === "analytics" && <Analytics drones={drones} />}
        {activeTab === "logs" && <Logs logs={logs} />}
      </main>
      <DeployModal 
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        onDeploy={handleDeployDrone}
      />
    </div>
  );
}

const Missions = () => (
  <div className="flex-1 bg-surface-container-lowest p-8 flex items-center justify-center">
    <div className="text-center">
      <span className="material-symbols-outlined text-6xl text-slate-600 mb-4 block">fact_check</span>
      <h2 className="text-2xl font-mono text-slate-400">Autonomous Missions</h2>
      <p className="text-slate-500 mt-2">Create and queue pre-flight programs.</p>
    </div>
  </div>
);

const Analytics = ({ drones }) => {
  const activeCount = drones.filter(d => d.status === 'MOVING' || d.status === 'MANUAL').length;
  const warningCount = drones.filter(d => d.status === 'WARNING').length;
  
  return (
    <div className="flex-1 bg-surface-container-lowest p-8">
      <h2 className="text-2xl font-mono text-slate-300 font-bold uppercase tracking-widest mb-8">Fleet Analytics</h2>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-surface-container-low border border-outline-variant/10 p-6 rounded-xl">
           <div className="text-xs font-bold text-slate-500 mb-2">Total Drones Available</div>
           <div className="text-4xl font-black text-sky-400">{drones.length}</div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/10 p-6 rounded-xl">
           <div className="text-xs font-bold text-slate-500 mb-2">Active Flight Tracking</div>
           <div className="text-4xl font-black text-emerald-400">{activeCount}</div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/10 p-6 rounded-xl">
           <div className="text-xs font-bold text-slate-500 mb-2">Critical Warnings</div>
           <div className="text-4xl font-black text-error">{warningCount}</div>
        </div>
      </div>
    </div>
  );
};

const Logs = ({ logs }) => (
  <div className="flex-1 bg-surface-container-lowest p-8 overflow-y-auto">
    <h2 className="text-xl font-mono text-slate-300 font-bold uppercase tracking-widest mb-6">Audit Logs</h2>
    <div className="space-y-3 font-mono text-sm max-w-4xl">
      {logs.map((log, i) => {
        const isWarning = log.msg.includes('WARNING') || log.msg.includes('EMERGENCY');
        return (
          <div key={i} className={`flex gap-4 p-3 rounded border ${isWarning ? 'bg-error-container/10 border-error/30 text-error' : 'bg-surface-container-low border-outline-variant/10 text-slate-300'}`}>
            <span className="opacity-50 shrink-0">{new Date(log.time).toISOString().split('T')[1].replace('Z','')}</span>
            <span>{log.msg}</span>
          </div>
        );
      })}
    </div>
  </div>
);

export default App;
