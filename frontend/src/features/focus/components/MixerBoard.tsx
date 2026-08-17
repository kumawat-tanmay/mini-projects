import React, { useEffect, useRef, useState } from 'react';
import { FocusMix } from '../api';
import { Volume2, VolumeX, Play, Pause, CloudRain, Coffee, CloudLightning, Bird } from 'lucide-react';

interface MixerBoardProps {
  mix: FocusMix;
  onVolumeChange: (channel: keyof FocusMix, volume: number) => void;
  onSaveMix: () => void;
}

const TRACKS = [
  {
    id: 'rain' as keyof FocusMix,
    name: 'Rainfall',
    icon: CloudRain,
    url: '/sounds/rain.mp3',
    color: 'bg-cyan-500',
  },
  {
    id: 'cafe' as keyof FocusMix,
    name: 'Cafe Ambience',
    icon: Coffee,
    url: '/sounds/cafe.mp3',
    color: 'bg-amber-600',
  },
  {
    id: 'noise' as keyof FocusMix,
    name: 'Thunderstorm',
    icon: CloudLightning,
    url: '/sounds/thunder.mp3',
    color: 'bg-purple-600',
  },
  {
    id: 'keyboard' as keyof FocusMix,
    name: 'Forest Birds',
    icon: Bird,
    url: '/sounds/birds.mp3',
    color: 'bg-emerald-600',
  },
];

export default function MixerBoard({ mix, onVolumeChange, onSaveMix }: MixerBoardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mutedChannels, setMutedChannels] = useState<Record<string, boolean>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  // Dynamic levels for VU meters and speaker vibration
  const [vuLevels, setVuLevels] = useState<Record<string, number>>({
    rain: 0,
    cafe: 0,
    noise: 0,
    keyboard: 0,
  });

  // VU meter and speaker vibration tick
  useEffect(() => {
    let animationFrameId: number;

    const updateVU = () => {
      if (isPlaying) {
        setVuLevels({
          rain: mutedChannels.rain || mix.rain === 0 ? 0 : Math.random() * mix.rain * 100,
          cafe: mutedChannels.cafe || mix.cafe === 0 ? 0 : Math.random() * mix.cafe * 100,
          noise: mutedChannels.noise || mix.noise === 0 ? 0 : Math.random() * mix.noise * 100,
          keyboard: mutedChannels.keyboard || mix.keyboard === 0 ? 0 : Math.random() * mix.keyboard * 100,
        });
      } else {
        setVuLevels({ rain: 0, cafe: 0, noise: 0, keyboard: 0 });
      }
      animationFrameId = requestAnimationFrame(updateVU);
    };

    updateVU();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, mutedChannels, mix]);

  // Synchronize audio volumes and play/pause state
  useEffect(() => {
    TRACKS.forEach((track) => {
      const audio = audioRefs.current[track.id];
      if (audio) {
        audio.volume = mutedChannels[track.id] ? 0 : mix[track.id];
        
        if (isPlaying && mix[track.id] > 0 && !mutedChannels[track.id]) {
          audio.play().catch((err) => console.log('Audio autoplay blocked:', err));
        } else {
          audio.pause();
        }
      }
    });
  }, [isPlaying, mix, mutedChannels]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause();
        }
      });
    };
  }, []);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (channel: keyof FocusMix) => {
    setMutedChannels((prev) => ({
      ...prev,
      [channel]: !prev[channel],
    }));
  };

  return (
    <div className="w-full max-w-4xl border-[12px] border-[#5a361e] bg-[#2d221c] bg-[radial-gradient(#1a1411_1px,transparent_1px)] [background-size:8px_8px] p-6 sm:p-8 rounded-2xl shadow-[12px_12px_0px_#000000] dark:shadow-[12px_12px_0px_#ffffff] transition-all">
      
      {/* Invisible Audio Elements */}
      {TRACKS.map((track) => (
        <audio
          key={track.id}
          ref={(el) => { audioRefs.current[track.id] = el; }}
          src={track.url}
          loop
          preload="auto"
        />
      ))}

      <div className="flex flex-col md:flex-row gap-8 items-stretch justify-between">
        
        {/* Left Control Panel: Master Vintage Control */}
        <div className="flex flex-col items-center justify-between border-4 border-[#3e271a] bg-[#4a2e1e] p-6 w-full md:w-72 rounded-lg relative overflow-hidden group select-none shadow-[4px_4px_0px_#000]">
          {/* Brass Plate effect */}
          <div className="absolute top-2 left-2 right-2 h-10 border-2 border-[#805030] bg-[#a87c53] opacity-20 pointer-events-none rounded" />
          
          <h3 className="font-serif font-black uppercase tracking-widest text-xs text-[#e0b784] z-10 mb-4">
            Acoustic Master
          </h3>
          
          {/* Master Toggle Dial/Switch */}
          <div className="flex-1 flex flex-col items-center justify-center my-6 z-10">
            <button
              onClick={togglePlay}
              className={`w-36 h-36 rounded-full border-4 border-[#1e1008] flex flex-col items-center justify-center z-10 transition-all duration-300 active:translate-y-1 active:translate-x-1 ${
                isPlaying 
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-[0px_0px_25px_rgba(16,185,129,0.5)] border-emerald-600' 
                  : 'bg-[#d4af37] hover:bg-[#c29e2e] shadow-[6px_6px_0px_#1e1008] border-[#a37c1a]'
              }`}
            >
              {isPlaying ? (
                <Pause size={44} strokeWidth={3.5} className="text-[#1a0f05] animate-pulse" />
              ) : (
                <Play size={44} strokeWidth={3.5} className="text-[#1a0f05] translate-x-1" />
              )}
            </button>
            
            <span className="font-serif font-black uppercase tracking-widest text-[10px] text-[#e0b784] mt-6">
              {isPlaying ? 'FLOW RUNNING' : 'SYSTEM OFF'}
            </span>
          </div>

          <button
            onClick={onSaveMix}
            className="w-full bg-[#1e1008] hover:bg-[#2d1b10] text-[#e0b784] border-2 border-[#5a361e] font-black uppercase text-[10px] tracking-widest py-2 active:translate-y-0.5 active:translate-x-0.5 transition-transform"
          >
            Save Preset
          </button>
        </div>

        {/* Right Panel: Retro Speaker Cabinets */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
          {TRACKS.map((track) => {
            const Icon = track.icon;
            const volume = mix[track.id];
            const isMuted = mutedChannels[track.id];
            const vuHeight = vuLevels[track.id];

            return (
              <div 
                key={track.id} 
                className="border-4 border-[#3e271a] bg-[#4a2e1e] p-4 flex flex-col items-center justify-between relative rounded-lg shadow-[4px_4px_0px_#000] min-h-[360px]"
              >
                
                {/* Speaker Drivers Visuals */}
                <div className="w-full flex flex-col items-center gap-4 my-2">
                  
                  {/* Tweeter (Small circle) */}
                  <div className="w-10 h-10 rounded-full bg-[#151515] border-2 border-[#1e1008] flex items-center justify-center shadow-inner relative">
                    {/* Metal center cap */}
                    <div className="w-3 h-3 rounded-full bg-[#444] border border-[#222]" />
                    <div className="absolute top-1 right-2 w-1 h-1 rounded-full bg-white opacity-20" />
                  </div>

                  {/* Woofer (Large circle - vibrates physically!) */}
                  <div 
                    className="w-24 h-24 rounded-full bg-[#1c1c1c] border-4 border-[#1e1008] flex items-center justify-center transition-transform duration-75 shadow-2xl relative select-none cursor-pointer"
                    style={{ 
                      transform: `scale(${1 + (vuHeight / 400)})`,
                      boxShadow: isPlaying && !isMuted && volume > 0 
                        ? '0px 0px 15px rgba(224, 183, 132, 0.15)' 
                        : 'inset 0 4px 6px rgba(0,0,0,0.6)'
                    }}
                    onClick={() => toggleMute(track.id)}
                  >
                    {/* Center dust cap */}
                    <div className="w-9 h-9 rounded-full bg-neutral-900 border-2 border-neutral-950 flex items-center justify-center shadow-inner">
                      <div className="w-4 h-4 rounded-full bg-neutral-950 border border-neutral-800" />
                    </div>
                    
                    {/* Retro Speaker cone lines */}
                    <div className="absolute inset-2 rounded-full border border-neutral-800/10 pointer-events-none" />
                    <div className="absolute inset-4 rounded-full border border-neutral-800/10 pointer-events-none" />
                  </div>

                </div>

                {/* Brass Label Tag */}
                <div className="flex flex-col items-center gap-0.5 border border-[#805030]/30 bg-[#2d1b10] px-2 py-0.5 rounded-sm">
                  <span className="font-serif font-black uppercase text-[9px] tracking-widest text-[#e0b784]">
                    {track.name}
                  </span>
                </div>

                {/* Vintage Fader Slider */}
                <div className="w-full flex justify-center py-4 px-2">
                  <div className="relative w-4 h-24 bg-[#1e1008] rounded border border-[#5a361e] flex items-center justify-center">
                    {/* Fader track line */}
                    <div className="absolute top-1 bottom-1 w-1 bg-[#120a05] rounded" />
                    
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => onVolumeChange(track.id, parseFloat(e.target.value))}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      style={{
                        writingMode: 'vertical-lr',
                        WebkitAppearance: 'slider-vertical',
                      }}
                    />
                    
                    {/* Vintage knob handle */}
                    <div 
                      className="absolute w-6 h-3 bg-[#d4af37] border border-[#1e1008] rounded-sm shadow-md pointer-events-none flex flex-col justify-between p-[2px]"
                      style={{ 
                        bottom: `calc(${(isMuted ? 0 : volume) * 85}% - 2px)`,
                      }}
                    >
                      <div className="h-[2px] bg-black opacity-40 w-full" />
                      <div className="h-[2px] bg-black opacity-40 w-full" />
                    </div>
                  </div>
                </div>

                {/* Bottom Toggle switch */}
                <div className="flex items-center justify-between w-full mt-1 border-t border-[#3e271a] pt-2">
                  <span className="font-mono text-[9px] font-bold text-[#e0b784]">
                    {isMuted ? 'MUTE' : `${Math.round(volume * 100)}%`}
                  </span>
                  
                  <button
                    onClick={() => toggleMute(track.id)}
                    className={`border-2 border-[#1e1008] p-1.5 active:translate-y-0.5 active:translate-x-0.5 transition-transform ${
                      isMuted 
                        ? 'bg-red-500 text-black shadow-none' 
                        : 'bg-[#d4af37] hover:bg-[#c29e2e] text-black shadow-[2px_2px_0px_#1e1008]'
                    }`}
                  >
                    {isMuted ? <VolumeX size={12} strokeWidth={2.5} /> : <Volume2 size={12} strokeWidth={2.5} />}
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
