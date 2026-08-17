"use client";

import React, { useEffect, useState } from 'react';
import { fetchFocusMix, updateFocusMix, FocusMix } from '@/features/focus/api';
import MixerBoard from '@/features/focus/components/MixerBoard';
import { ShieldAlert } from 'lucide-react';

export default function FocusPage() {
  const [mix, setMix] = useState<FocusMix>({
    rain: 0.5,
    cafe: 0.2,
    noise: 0.3,
    keyboard: 0.1,
  });

  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const data = await fetchFocusMix();
        // Fallback checks in case backend sends incomplete object
        setMix({
          rain: typeof data.rain === 'number' ? data.rain : 0.5,
          cafe: typeof data.cafe === 'number' ? data.cafe : 0.2,
          noise: typeof data.noise === 'number' ? data.noise : 0.3,
          keyboard: typeof data.keyboard === 'number' ? data.keyboard : 0.1,
        });
      } catch (err) {
        console.error('Failed to load focus mix settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handleVolumeChange = (channel: keyof FocusMix, volume: number) => {
    setMix((prev) => ({
      ...prev,
      [channel]: volume,
    }));
  };

  const handleSaveMix = async () => {
    try {
      await updateFocusMix(mix);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save focus settings:', err);
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-6 sm:py-12">

      {saveSuccess && (
        <div className="bg-emerald-400 text-black border-4 border-black px-4 py-2 font-black uppercase tracking-wider text-xs mb-6 animate-bounce">
          Mixer Preset Saved Successfully!
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 min-h-[300px]">
          <div className="w-12 h-12 border-4 border-black dark:border-neutral-700 border-t-transparent animate-spin mb-4" />
          <span className="font-black uppercase tracking-widest text-xs text-black dark:text-white">Loading Sound Mixer...</span>
        </div>
      ) : (
        <MixerBoard
          mix={mix}
          onVolumeChange={handleVolumeChange}
          onSaveMix={handleSaveMix}
        />
      )}

      {/* Safari Autoplay Note */}
      <div className="mt-12 max-w-md p-4 border-4 border-black bg-yellow-100 dark:bg-yellow-950 flex gap-3 text-left">
        <ShieldAlert className="shrink-0 text-yellow-600 dark:text-yellow-400" size={20} />
        <div>
          <h4 className="font-black text-xs uppercase tracking-wider text-black dark:text-white mb-0.5">Browser Notice</h4>
          <p className="text-[10px] font-bold text-slate-700 dark:text-neutral-300 leading-normal uppercase">
            If audio does not start playing when clicking the play button, check if your browser blocks autoplay for media assets and allow sound permissions.
          </p>
        </div>
      </div>

    </div>
  );
}
