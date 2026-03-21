# NeuroSky

AI-Powered Drone Traffic Management System.

## Architecture

A modular full-stack monorepo consisting of:
- **Core Simulator (`backend/src/services/droneService.js`)**: Generates real-time pseudo-random kinematics representing flight coordinates over the SF Bay parameters.
- **Collision Engine (`backend/src/services/collisionService.js`)**: Real-time scalable spatial grid-pruning (O(1)) paired with Haversine geometric approximations to emit exact threshold warnings and critical alerts.
- **Real-Time Controller (`backend/src/socket/index.js`)**: Socket.IO controller utilizing typed payloads with Zod structure validations filtering invalid client transmissions.
- **Vite React Frontend (`frontend/src`)**: Subscribed strictly to backend emissions rendering memoized UI states to mitigate browser execution flickers using custom Leaflet overlays.

## Setup Instructions

1. Ensure **Node.js** (v18+) is installed.
2. From the project root, install all dependencies simultaneously:
   ```bash
   npm run install:all
   ```
3. Run both servers (Backend on Port 3001, Frontend on Port 5173):
   ```bash
   npm run dev
   ```

## Production Ready Features
- O(1) Pre-flight Math Spatial bounds checking mitigating high-frequency redundant collision polling.
- Strictly validated input/output Zod schemas restricting corrupted traffic data.
- Rate-Limited and Helmet-hardened Express entry point.
- React.Memo interceptors checking exact coordinate states avoiding DOM reflow thrashing.
