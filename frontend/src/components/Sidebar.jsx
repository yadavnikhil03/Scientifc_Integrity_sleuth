import React, { useState, useEffect } from 'react';
import { Shield, Binary, History, BarChart3, Settings } from 'lucide-react';

export const Sidebar = React.memo(({ backendStatus }) => {
  const [metrics, setMetrics] = useState({ cpu: 12, gpu: 2, ram: 4.2 });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.max(5, Math.min(95, 12 + (Math.random() * 10 - 5))),
        gpu: Math.max(0, Math.min(100, 2 + (Math.random() * 4 - 2))),
        ram: Math.max(2, Math.min(16, 4.2 + (Math.random() * 0.2 - 0.1)))
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="sidebar">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-100">Sleuth Lab</h1>
            <div className="flex items-center gap-1.5">
              <span className={`status-dot ${backendStatus === 'online' ? 'online' : 'offline'}`}></span>
              <span className={`text-[10px] font-bold uppercase ${backendStatus === 'online' ? 'text-emerald-500' : 'text-red-500'}`}>
                {backendStatus === 'online' ? 'Node Online' : 'Node Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <nav className="p-4 flex-grow space-y-1">
        <SidebarLink icon={<Binary className="w-4 h-4" />} label="Workspace" active={true} />
        <SidebarLink icon={<History className="w-4 h-4" />} label="Analysis History" />
        <SidebarLink icon={<BarChart3 className="w-4 h-4" />} label="Statistics" />
        <div className="pt-4 mt-4 border-t border-slate-700/30">
          <SidebarLink icon={<Settings className="w-4 h-4" />} label="Global Config" />
        </div>
      </nav>

      <div className="p-5 border-t border-slate-700/50 bg-slate-900/30">
        <p className="mono-label mb-3">Hardware Status</p>
        <div className="space-y-2.5">
          <MetricBar label="CPU Load" value={metrics.cpu.toFixed(0)} color="emerald" />
          <MetricBar label="Memory" value={metrics.ram.toFixed(1)} color="blue" />
          <MetricBar label="GPU Intensity" value={metrics.gpu.toFixed(0)} color="amber" />
        </div>
      </div>
    </aside>
  );
});

const SidebarLink = ({ icon, label, active }) => (
  <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs transition-all ${active ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/10 shadow-lg shadow-emerald-500/5' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'}`}>
    {icon}
    {label}
  </button>
);

const MetricBar = ({ label, value, color }) => {
  const colors = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500'
  };
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
        <span>{label}</span>
        <span>{value}{label === 'Memory' ? 'GB' : '%'}</span>
      </div>
      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`${colors[color]} h-full rounded-full transition-all duration-1000`} 
          style={{ width: `${(parseFloat(value) / (label === 'Memory' ? 16 : 1)) * (label === 'Memory' ? 100/16 : 1)}%` }}
        ></div>
      </div>
    </div>
  );
};
