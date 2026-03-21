import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Critical: Leaflet CSS Import for rendering
import 'leaflet/dist/leaflet.css';

// Fix: Default Marker Icons in Vite/Webpack build environments
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
