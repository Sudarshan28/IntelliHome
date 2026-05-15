import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';

export default function Devices() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/devices`)
      .then(res => res.json())
      .then(data => setDevices(data));
  }, []);

  const addSeedDevices = async () => {
    // Check if devices already exist to prevent duplication
    if (devices.length > 0) {
      alert("Devices already seeded.");
      return;
    }
    const seeds = [
      { name: 'Living Room Light', type: 'light', room: 'Living Room' },
      { name: 'Bedroom AC', type: 'ac', room: 'Master Bedroom' },
      { name: 'Front Door Camera', type: 'sensor', room: 'Entrance' },
      { name: 'Kitchen Smoke Detector', type: 'alarm', room: 'Kitchen' }
    ];

    for (let seed of seeds) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seed)
      });
    }
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Device Management</h2>
          <p className="text-gray-400 mt-1">Manage and configure your smart home devices.</p>
        </div>
        <button 
          onClick={addSeedDevices}
          className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2 rounded-xl font-medium transition-colors shadow-[0_0_15px_rgba(20,184,166,0.4)]"
        >
          Seed Mock Devices
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {devices.map(device => (
          <GlassCard key={device._id} className="flex justify-between items-center py-4">
            <div>
              <h3 className="font-semibold text-lg">{device.name}</h3>
              <p className="text-sm text-gray-400">{device.type} • {device.room}</p>
            </div>
            <div className="px-3 py-1 rounded-full text-sm font-medium border border-white/10 bg-dark-800">
              {device.status.toUpperCase()}
            </div>
          </GlassCard>
        ))}
        {devices.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No devices found. Click "Seed Mock Devices" to generate some.
          </div>
        )}
      </div>
    </div>
  );
}
