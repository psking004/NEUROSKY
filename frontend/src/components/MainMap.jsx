import React, { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const StaticMapLayer = React.memo(() => (
  <TileLayer
    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  />
));

const MapController = React.memo(({ selectedDroneId, selectedDronePos, isFollowing }) => {
  const map = useMap();
  
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 13);
      },
      () => {
        map.setView([20, 0], 2); // fallback
      }
    );
  }, [map]);

  useEffect(() => {
    if (selectedDroneId && selectedDronePos && isFollowing) {
      map.panTo(selectedDronePos, { animate: true });
    }
  }, [selectedDroneId, selectedDronePos, isFollowing, map]); 
  
  return null;
});

const DroneMarker = React.memo(({ drone, isSelected, onSelect }) => {
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const { id, name, status, telemetry, target, destination } = drone;

  const currentPosRef = useRef(drone.position || [0, 0]);
  const pathRef = useRef(drone.position ? [drone.position] : []);
  const targetRef = useRef(target || drone.position || [0, 0]);

  useEffect(() => {
    if (target) {
      targetRef.current = target;
    }
  }, [target]);
  
  const heading = telemetry?.heading || 0;
  const altitude = telemetry?.altitude || 0;
  const displayName = name || id;

  useEffect(() => {
    let animationFrameId;
    
    const animate = () => {
      const [currentLat, currentLng] = currentPosRef.current;
      const [targetLat, targetLng] = targetRef.current;

      const latDiff = targetLat - currentLat;
      const lngDiff = targetLng - currentLng;
      
      if (Math.abs(latDiff) > 0.000001 || Math.abs(lngDiff) > 0.000001) {
        const newLat = currentLat + latDiff * 0.1;
        const newLng = currentLng + lngDiff * 0.1;
        const newPos = [newLat, newLng];
        
        currentPosRef.current = newPos;
        
        if (markerRef.current) {
          markerRef.current.setLatLng(newPos);
        }
        
        const lastPos = pathRef.current[pathRef.current.length - 1];
        if (!lastPos || Math.abs(lastPos[0] - newLat) > 0.00005 || Math.abs(lastPos[1] - newLng) > 0.00005) {
           pathRef.current.push(newPos);
           if (pathRef.current.length > 500) pathRef.current.shift();
           
           if (polylineRef.current) {
             polylineRef.current.setLatLngs(pathRef.current);
           }
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const htmlIcon = useMemo(() => {
    let iconColor = '#8ed5ff';
    if (status === 'WARNING') iconColor = '#f87171'; // red
    else if (isSelected) iconColor = '#38bdf8';
    else if (status === 'HOLDING' || status === 'IDLE' || status === 'STOPPED') iconColor = '#bdc2ff';

    const shadowColor = status === 'WARNING' ? 'rgba(248, 113, 113, 0.6)' : 
                       (isSelected ? 'rgba(56, 189, 248, 0.6)' : 'rgba(142, 213, 255, 0.4)');
    const shouldPulse = isSelected || status === 'WARNING';

    return L.divIcon({
      className: 'custom-drone-marker',
      html: `
        <div class="relative group cursor-pointer">
          <div class="w-8 h-8 flex items-center justify-center filter drop-shadow-[0_0_8px_${shadowColor}] ${shouldPulse ? 'animate-pulse' : ''}" style="color: ${iconColor};">
            <span class="material-symbols-outlined text-4xl drone-rotator" style="transform: rotate(0deg); transition: transform 0.2s linear;">navigation</span>
          </div>
          ${(isSelected || status === 'WARNING') ? `
          <div class="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-container-high rounded border ${status === 'WARNING' ? 'border-error/50 text-error' : 'border-primary/30 text-primary'} whitespace-nowrap">
            <span class="text-[10px] font-mono font-bold tracking-tighter drone-text">Loading...</span>
          </div>
          ` : ''}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }, [isSelected, status]);

  useEffect(() => {
    if (markerRef.current) {
      const el = markerRef.current.getElement();
      if (el) {
        const rotator = el.querySelector('.drone-rotator');
        if (rotator) rotator.style.transform = `rotate(${heading}deg)`;
        
        const textSpan = el.querySelector('.drone-text');
        if (textSpan) textSpan.innerText = `${displayName} | ${Math.round(altitude)}m${status === 'WARNING' ? ' ⚠️' : ''}`;
      }
    }
  }, [heading, altitude, displayName, status]);

  const eventHandlers = useMemo(() => ({
    click: () => onSelect(id)
  }), [id, onSelect]);

  if (currentPosRef.current[0] === 0 && currentPosRef.current[1] === 0) return null;
  const currentPos = currentPosRef.current;
  const targetPath = destination?.latitude && destination?.longitude && destination.latitude !== 0 ? [currentPos, [destination.latitude, destination.longitude]] : null;

  return (
    <>
      <Marker 
        position={currentPos} 
        icon={htmlIcon}
        eventHandlers={eventHandlers}
        ref={markerRef}
      />
      <Polyline ref={polylineRef} positions={pathRef.current} color={status === 'WARNING' ? '#ef4444' : (isSelected ? '#38bdf8' : '#8ed5ff')} weight={2} opacity={0.5} />
      
      {targetPath && status !== 'WARNING' && (
        <Polyline positions={targetPath} color="#ffb4ab" weight={2} dashArray="4, 8" opacity={0.6} />
      )}
    </>
  );
}, (prevProps, nextProps) => {
  const pTel = prevProps.drone.telemetry;
  const nTel = nextProps.drone.telemetry;
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.drone.status === nextProps.drone.status &&
    prevProps.drone.target?.[0] === nextProps.drone.target?.[0] &&
    prevProps.drone.target?.[1] === nextProps.drone.target?.[1] &&
    pTel?.heading === nTel?.heading &&
    pTel?.altitude === nTel?.altitude &&
    JSON.stringify(prevProps.drone.destination) === JSON.stringify(nextProps.drone.destination)
  );
});

const MarkerLayer = React.memo(({ drones, selectedDroneId, onSelectDrone }) => {
  return (
    <>
      {drones.map(drone => (
        <DroneMarker 
          key={drone.id} 
          drone={drone} 
          isSelected={drone.id === selectedDroneId}
          onSelect={onSelectDrone}
        />
      ))}
    </>
  );
});

const MapEvents = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MainMap = React.memo(({ drones = [], selectedDroneId, onSelectDrone, onMapClick, noFlyZones = [] }) => {
  const mapRef = useRef(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const defaultCenter = useMemo(() => [37.7749, -122.4194], []);

  const handleSelectDrone = useCallback((id) => {
    onSelectDrone(id);
  }, [onSelectDrone]);

  const selectedDronePos = useMemo(() => {
    const sd = drones.find(d => d.id === selectedDroneId);
    return sd?.telemetry?.lat ? [sd.telemetry.lat, sd.telemetry.lon] : null;
  }, [selectedDroneId, drones]);

  const hasEmergency = useMemo(() => drones.some(d => d.status === 'WARNING' || d.status === 'EMERGENCY'), [drones]);

  return (
    <section className="flex-1 ml-[320px] mr-[360px] relative bg-surface-container-lowest overflow-hidden">
      <div className="absolute inset-0 z-0">
        <MapContainer 
          ref={mapRef}
          center={defaultCenter} 
          zoom={13} 
          style={{ height: '100%', width: '100%', backgroundColor: '#0b1326' }}
          zoomControl={false}
          attributionControl={false}
        >
          <MapEvents onMapClick={onMapClick} />
          <StaticMapLayer />
          <MapController selectedDroneId={selectedDroneId} selectedDronePos={selectedDronePos} isFollowing={isFollowing} />
          
          {noFlyZones.map(nfz => (
            <Circle 
              key={nfz.id}
              center={nfz.center}
              radius={nfz.radius}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.1,
                weight: 1,
                dashArray: '4, 4'
              }}
            />
          ))}

          <MarkerLayer drones={drones} selectedDroneId={selectedDroneId} onSelectDrone={handleSelectDrone} />
        </MapContainer>
        
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_#0b1326_100%)]"></div>
        <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'linear-gradient(#8ed5ff 1px, transparent 1px), linear-gradient(90deg, #8ed5ff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="absolute top-4 right-4 z-[400]">
        <button
          onClick={() => setIsFollowing(!isFollowing)}
          className={`px-4 py-2 font-mono text-xs rounded-lg shadow-lg flex items-center gap-2 transition-colors ${isFollowing ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container-high border border-outline-variant/30 text-slate-300'}`}
        >
          <span className="material-symbols-outlined text-sm">{isFollowing ? 'location_on' : 'location_off'}</span>
          {isFollowing ? 'FOLLOWING DRONE' : 'FOLLOW MODE OFF'}
        </button>
      </div>

      {hasEmergency && (
        <div className="absolute bottom-8 right-8 z-30 animate-bounce pointer-events-none">
          <div className="bg-error-container/90 backdrop-blur-xl border border-error/50 p-4 rounded-xl flex items-center gap-4 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-error flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <div>
              <div className="text-[10px] font-mono text-on-error-container font-bold uppercase tracking-widest">System Alert</div>
              <div className="text-sm font-bold text-white">Emergency state detected</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

export default MainMap;
