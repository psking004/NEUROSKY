import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children, drones, connected, onOpenDeploy }) => {
  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden font-body">
      {/* GLOBAL HEADER */}
      <Header connected={connected} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDENAV REGISTRY */}
        <Sidebar drones={drones} onOpenDeploy={onOpenDeploy} />

        {/* PRIMARY WORKSPACE - MAP & OVERLAYS */}
        <main className="flex-1 ml-80 pt-16 relative overflow-hidden bg-slate-200">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
