import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icons in Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Rotated Drone Icon using arrow.png
const createDroneIcon = (heading = 0) => new L.DivIcon({
  className: 'drone-marker-ptr',
  html: `<img src="/arrow.png" style="width: 44px; height: 44px; transform: rotate(${heading}deg); filter: drop-shadow(0 0 10px #38bdf8); transition: transform 0.5s ease-out;" />`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const MapView = ({ drones = [], onDroneClick }) => {
  return (
    <div className="map-view h-full w-full">
      <MapContainer 
        center={[37.7749, -122.4194]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false} // Disable default zoom to match Stitch UI
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {drones.map((d) => (
          <Marker 
            key={d.id} 
            position={[d.lat, d.lng]} 
            icon={createDroneIcon(d.heading)}
            eventHandlers={{
                click: () => onDroneClick && onDroneClick(d)
            }}
          >
            {/* Popups disabled to prefer Telemetry Panel */}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
