import React, { useState, useEffect } from 'react';
import { Scene } from './components/Scene';
import { TreeConfig, INITIAL_CONFIG } from './types';
import { Settings, Sparkles, Snowflake, RefreshCw, Palette, Gift, Hand, Camera } from 'lucide-react';
import { HandProvider, useHandTracking } from './components/HandContext';

// --- Inner App Component to consume context ---
const InnerApp = () => {
  const [config, setConfig] = useState<TreeConfig>(INITIAL_CONFIG);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { videoRef, canvasRef, startCamera, isTracking, isInitializing } = useHandTracking();

  useEffect(() => {
      // Auto-start camera after initialization
      if (!isInitializing) {
          startCamera();
      }
  }, [isInitializing, startCamera]);

  const toggleConfig = (key: keyof TreeConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key as keyof TreeConfig] }));
  };

  const updateConfig = (key: keyof TreeConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="relative w-full h-screen bg-[#12050b] text-white overflow-hidden font-sans">
      
      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0 cursor-move">
        <Scene config={config} />
      </div>

      {/* Header / Title */}
      <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none flex justify-between items-start">
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 pointer-events-auto shadow-2xl shadow-pink-900/20">
             <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-200 via-rose-300 to-amber-200 bg-clip-text text-transparent flex items-center gap-2">
                <Gift className="text-pink-300" />
                <span className="tracking-wide">For Winnie</span>
             </h1>
             <p className="text-xs text-pink-100/70 mt-1 uppercase tracking-widest font-light">3D Interactive Experience</p>
        </div>
      </div>

      {/* Webcam Preview (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2 pointer-events-auto">
         <div className="relative w-36 h-28 bg-black/40 rounded-xl overflow-hidden border border-white/20 shadow-lg">
             {/* Container for Video + Canvas Overlay */}
             <div className="relative w-full h-full transform -scale-x-100">
                 <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="absolute inset-0 w-full h-full object-cover opacity-80" 
                 />
                 <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover"
                 />
             </div>

             <div className="absolute top-1 right-1 bg-black/50 p-1 rounded-full z-10">
                 <Camera className={`w-3 h-3 ${isTracking ? 'text-green-400' : 'text-white/50'}`} />
             </div>
             {isInitializing && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] text-white/70 z-20">
                     Loading AI...
                 </div>
             )}
         </div>
         <div className={`flex items-center gap-2 text-sm backdrop-blur-md px-3 py-1.5 rounded-full border transition-colors ${isTracking ? 'bg-green-500/20 border-green-500/30 text-green-100' : 'bg-white/5 border-white/10 text-pink-100/70'}`}>
            <Hand className="w-3 h-3" />
            <span className="text-xs font-medium tracking-wide">
                {isTracking ? "Tracking Hand" : "Show hand to control"}
            </span>
         </div>
      </div>

      {/* Floating Controls */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-4 pointer-events-auto">
        
        {/* Toggle Menu Button */}
        <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-4 rounded-full bg-pink-500/80 hover:bg-pink-400 backdrop-blur-sm shadow-lg shadow-pink-900/40 transition-all active:scale-95 group border border-white/20"
        >
            <Settings className={`w-6 h-6 transition-transform duration-500 text-white ${isMenuOpen ? 'rotate-90' : ''}`} />
        </button>

        {/* Menu Items */}
        <div className={`
            flex flex-col gap-4 bg-black/40 backdrop-blur-xl border border-white/10 p-5 rounded-2xl transition-all duration-300 origin-bottom-right w-64
            ${isMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4 pointer-events-none'}
        `}>
            
            {/* Color Controls */}
            <div className="flex flex-col gap-3">
                <label className="text-xs text-pink-200/60 uppercase font-semibold tracking-widest flex items-center gap-2">
                    <Palette className="w-3 h-3" /> Palette
                </label>
                <div className="flex gap-3 items-center justify-between group">
                    <span className="text-sm font-light text-gray-200 group-hover:text-pink-200 transition-colors">Tree Tone</span>
                    <div className="relative overflow-hidden rounded-full w-8 h-8 ring-1 ring-white/30">
                        <input 
                            type="color" 
                            value={config.treeColor}
                            onChange={(e) => updateConfig('treeColor', e.target.value)}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 cursor-pointer border-none"
                        />
                    </div>
                </div>
                 <div className="flex gap-3 items-center justify-between group">
                    <span className="text-sm font-light text-gray-200 group-hover:text-pink-200 transition-colors">Glow Color</span>
                    <div className="relative overflow-hidden rounded-full w-8 h-8 ring-1 ring-white/30">
                        <input 
                            type="color" 
                            value={config.lightColor}
                            onChange={(e) => updateConfig('lightColor', e.target.value)}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 cursor-pointer border-none"
                        />
                    </div>
                </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full"></div>

            {/* Rotation Control */}
            <div className="flex flex-col gap-3">
                 <label className="text-xs text-pink-200/60 uppercase font-semibold tracking-widest flex items-center gap-2">
                    <RefreshCw className="w-3 h-3" /> Motion
                </label>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={config.rotationSpeed}
                    onChange={(e) => updateConfig('rotationSpeed', parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-400 hover:accent-pink-300 transition-all"
                />
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full"></div>

            {/* Toggles */}
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => toggleConfig('showSnow')}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all border border-transparent ${config.showSnow ? 'bg-white/10 border-white/5 text-pink-100 shadow-inner' : 'hover:bg-white/5 text-gray-400'}`}
                >
                    <span className="flex items-center gap-2 font-light"><Snowflake className="w-4 h-4" /> Snowfall</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${config.showSnow ? 'bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]' : 'bg-gray-600'}`}></span>
                </button>

                <button 
                    onClick={() => toggleConfig('isShiny')}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all border border-transparent ${config.isShiny ? 'bg-white/10 border-white/5 text-pink-100 shadow-inner' : 'hover:bg-white/5 text-gray-400'}`}
                >
                    <span className="flex items-center gap-2 font-light"><Sparkles className="w-4 h-4" /> Dreamy Glow</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${config.isShiny ? 'bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.8)]' : 'bg-gray-600'}`}></span>
                </button>
            </div>
        </div>
      </div>

    </div>
  );
};

const App = () => {
  return (
    <HandProvider>
        <InnerApp />
    </HandProvider>
  )
}

export default App;
