import { useState, useEffect } from 'react';
import { Smartphone, Monitor, RotateCw, X, ChevronDown } from 'lucide-react';

const DEVICE_SIZES = [
  { id: 'iphone15', name: 'iPhone 15 / 14 Pro', width: 393, height: 852, radius: '44px', notch: 'island' },
  { id: 'pixel8', name: 'Google Pixel 8', width: 412, height: 915, radius: '36px', notch: 'hole' },
  { id: 'compact', name: 'iPhone SE / Compact', width: 375, height: 667, radius: '32px', notch: 'bezel' },
];

function MobileFrameSimulator({ children }) {
  const [isMobileSimActive, setIsMobileSimActive] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(DEVICE_SIZES[0]);
  const [isLandscape, setIsLandscape] = useState(false);

  // Sync keyboard shortcut (Alt + M) to toggle simulator
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        setIsMobileSimActive(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const deviceW = isLandscape ? selectedDevice.height : selectedDevice.width;
  const deviceH = isLandscape ? selectedDevice.width : selectedDevice.height;

  return (
    <div className="relative min-h-screen">
      {/* Simulator Toggle Floating Controller */}
      <div className="fixed bottom-4 right-4 z-[99999] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsMobileSimActive(!isMobileSimActive)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl font-black text-xs shadow-2xl transition-all duration-300 border cursor-pointer active:scale-95 ${
            isMobileSimActive
              ? 'bg-amber-400 text-emerald-950 border-amber-300 ring-2 ring-amber-400/50'
              : 'bg-emerald-900/90 hover:bg-emerald-800 text-white border-emerald-700/80 backdrop-blur-md'
          }`}
          title="Toggle Cellphone Device Viewfinder (Alt + M)"
        >
          {isMobileSimActive ? <Monitor className="w-4 h-4 text-emerald-950" /> : <Smartphone className="w-4 h-4 text-amber-400" />}
          <span>{isMobileSimActive ? 'Exit Phone Mode' : '📱 Phone View'}</span>
        </button>
      </div>

      {isMobileSimActive ? (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[99980] flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden animate-fade-in">
          {/* Top Emulator Control Bar */}
          <div className="bg-slate-800/90 border border-slate-700/80 text-white px-4 py-2 rounded-2xl mb-4 flex items-center justify-between gap-3 shadow-xl max-w-lg w-full shrink-0">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-black tracking-tight text-slate-200 hidden sm:inline">Cellphone Viewfinder:</span>
              <div className="relative">
                <select
                  value={selectedDevice.id}
                  onChange={(e) => setSelectedDevice(DEVICE_SIZES.find(d => d.id === e.target.value))}
                  className="bg-slate-900 text-amber-300 border border-slate-700 text-xs font-bold px-2.5 py-1 rounded-xl outline-none pr-6 cursor-pointer"
                >
                  {DEVICE_SIZES.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.width}x{d.height})</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLandscape(!isLandscape)}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-200 transition-colors cursor-pointer"
                title="Rotate Orientation"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsMobileSimActive(false)}
                className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl transition-colors cursor-pointer"
                title="Close Phone View"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Smartphone Hardware Frame */}
          <div
            className="relative bg-slate-950 p-3 sm:p-4 rounded-[48px] shadow-2xl border-4 border-slate-700/80 flex flex-col items-center justify-center transition-all duration-300"
            style={{
              width: `${deviceW + 32}px`,
              height: `min(${deviceH + 32}px, 86vh)`,
              maxWidth: '96vw',
            }}
          >
            {/* Top Speaker / Dynamic Notch */}
            <div className="absolute top-4 z-[9999] flex items-center justify-center pointer-events-none">
              {selectedDevice.notch === 'island' && (
                <div className="w-28 h-5 bg-black rounded-full border border-slate-800 flex items-center justify-end px-2 gap-1.5 shadow-md">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700"></div>
                </div>
              )}
              {selectedDevice.notch === 'hole' && (
                <div className="w-3.5 h-3.5 bg-black rounded-full border border-slate-800 shadow-md"></div>
              )}
            </div>

            {/* Inner Phone Screen Container */}
            <div
              className="w-full h-full bg-white overflow-hidden shadow-inner relative flex flex-col"
              style={{
                borderRadius: selectedDevice.radius,
              }}
            >
              {children}
            </div>

            {/* Bottom Home Indicator Line */}
            <div className="absolute bottom-2.5 z-[9999] pointer-events-none">
              <div className="w-32 h-1 bg-slate-500/60 rounded-full"></div>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default MobileFrameSimulator;
