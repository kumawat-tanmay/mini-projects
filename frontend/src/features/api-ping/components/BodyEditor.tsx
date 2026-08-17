import React, { useState } from 'react';
import { AlignLeft } from 'lucide-react';

interface BodyEditorProps {
  body: string;
  onChange: (body: string) => void;
}

export default function BodyEditor({ body, onChange }: BodyEditorProps) {
  const [error, setError] = useState<string | null>(null);

  const handleFormat = () => {
    if (!body.trim()) return;
    try {
      const parsed = JSON.parse(body);
      onChange(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err: any) {
      setError('Invalid JSON: ' + err.message);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h4 className="font-black uppercase tracking-wider text-xs text-black dark:text-white">Request Body (JSON)</h4>
          {error && (
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
              {error}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleFormat}
          className="bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-black uppercase text-[10px] tracking-wider px-2 py-1.5 border-2 border-black flex items-center gap-1 active:translate-y-0.5 active:translate-x-0.5 transition-transform"
        >
          <AlignLeft size={12} /> Format JSON
        </button>
      </div>

      <div className="border-4 border-black bg-white dark:bg-neutral-900 overflow-hidden h-[200px]">
        <textarea
          value={body}
          onChange={(e) => {
            onChange(e.target.value);
            setError(null);
          }}
          placeholder='{\n  "key": "value"\n}'
          data-lenis-prevent
          className="w-full h-full p-3 font-mono text-xs bg-transparent outline-none resize-none text-black dark:text-white block border-0 leading-normal overflow-y-auto"
        />
      </div>
    </div>
  );
}
