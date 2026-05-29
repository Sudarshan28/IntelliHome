import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import GlassCard from './GlassCard';
import { Smartphone, Laptop, QrCode, ExternalLink, Copy, Check } from 'lucide-react';

export default function DeviceDashboard() {
  const { user } = useContext(AuthContext);
  const [copied, setCopied] = useState(false);

  // Generate target client URL with query params
  const backendUrl = import.meta.env.VITE_API_URL || window.location.origin;
  const clientUrl = `${window.location.origin}/device-client.html?userId=${user?._id || user?.id || ''}&backendUrl=${encodeURIComponent(backendUrl)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(clientUrl)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(clientUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <GlassCard className="border-brand-500/10 bg-brand-950/5 p-6 md:p-8 mt-10">
      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-between">
        
        {/* Onboarding Instructions */}
        <div className="flex-1 space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Smartphone className="text-brand-400" size={24} />
              Connect Real Devices (Zero Cost)
            </h3>
            <p className="text-gray-400 mt-2 text-sm leading-relaxed">
              You can connect your phone, iPad, or another browser window as a virtual smart device. 
              The device will register in your account, stream live electricity metrics (kWh + ₹ cost), 
              and respond instantly to FSM automation triggers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-dark-800/60 p-4 rounded-xl border border-white/5 flex gap-3">
              <div className="p-2 bg-brand-500/10 text-brand-400 rounded-lg h-fit flex-shrink-0">
                <QrCode size={18} />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Scan QR Code</h4>
                <p className="text-xs text-gray-400 mt-1">Scan the QR code on the right with your phone camera to auto-fill configurations.</p>
              </div>
            </div>

            <div className="bg-dark-800/60 p-4 rounded-xl border border-white/5 flex gap-3">
              <div className="p-2 bg-brand-500/10 text-brand-400 rounded-lg h-fit flex-shrink-0">
                <Laptop size={18} />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Connect this Laptop</h4>
                <p className="text-xs text-gray-400 mt-1">Click the button below to launch a virtual device in a new tab immediately.</p>
              </div>
            </div>
          </div>

          {/* Links & Quick Actions */}
          <div className="pt-2 flex flex-wrap gap-3">
            <a 
              href={clientUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-3 rounded-xl font-bold text-xs transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_20px_rgba(20,184,166,0.5)]"
            >
              <ExternalLink size={14} />
              Open Device Client in New Tab
            </a>

            <button 
              onClick={handleCopyLink}
              className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 border border-white/10 text-gray-300 px-5 py-3 rounded-xl font-bold text-xs transition-all"
            >
              {copied ? (
                <>
                  <Check className="text-emerald-400" size={14} />
                  Copied URL!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy Client Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="w-fit flex-shrink-0 flex flex-col items-center gap-3 bg-dark-800/40 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="bg-white p-3 rounded-xl shadow-lg border border-white/10">
            <img 
              src={qrCodeUrl} 
              alt="Device Connection QR Code"
              className="w-[160px] h-[160px]"
              onError={(e) => {
                e.target.src = "https://placehold.co/160x160/2dd4bf/ffffff?text=Scan+QR+Code";
              }}
            />
          </div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider font-mono">
            Scan to Connect Phone
          </span>
        </div>

      </div>
    </GlassCard>
  );
}
