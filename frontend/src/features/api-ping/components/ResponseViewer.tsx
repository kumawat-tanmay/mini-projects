import React, { useState } from 'react';
import { ProxyResponse } from '../api';
import { Copy, Check, Terminal } from 'lucide-react';

interface ResponseViewerProps {
  response: ProxyResponse | null;
  loading: boolean;
}

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300) return 'bg-emerald-400 text-black border-emerald-500';
  if (status >= 300 && status < 400) return 'bg-yellow-400 text-black border-yellow-500';
  if (status >= 400 && status < 500) return 'bg-orange-400 text-black border-orange-500';
  return 'bg-red-400 text-white border-red-500';
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
};

export default function ResponseViewer({ response, loading }: ResponseViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!response?.data) return;
    navigator.clipboard.writeText(response.data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="border-4 border-black bg-white dark:bg-neutral-900 p-8 flex flex-col items-center justify-center min-h-[250px]">
        <div className="w-10 h-10 border-4 border-black dark:border-neutral-700 border-t-transparent animate-spin mb-4" />
        <span className="font-black uppercase tracking-widest text-xs text-black dark:text-white">Sending Request...</span>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="border-4 border-black border-dashed bg-white dark:bg-neutral-900/50 p-12 flex flex-col items-center justify-center min-h-[250px] text-slate-400 dark:text-neutral-500">
        <Terminal className="mb-2 opacity-50" size={32} />
        <span className="font-black uppercase tracking-widest text-xs">Response console</span>
        <p className="text-[10px] uppercase font-bold tracking-wider mt-1">Enter URL and click Send to test an API endpoint</p>
      </div>
    );
  }

  let formattedData = response.data;
  try {
    const json = JSON.parse(response.data);
    formattedData = JSON.stringify(json, null, 2);
  } catch (e) {
    // Treat as plain text
  }

  return (
    <div className="space-y-4">
      {/* Response Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-4 border-black bg-neutral-100 dark:bg-neutral-800 p-3">
        <div className="flex items-center gap-4">
          <span className="font-black uppercase tracking-wider text-xs text-black dark:text-white">Response:</span>
          <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 border-2 border-black ${getStatusColor(response.status)}`}>
            {response.status} {response.statusText}
          </span>
        </div>
        
        <div className="flex gap-4 font-mono text-[11px] font-bold text-slate-600 dark:text-neutral-300">
          <span>Time: <strong className="text-black dark:text-white">{response.time} ms</strong></span>
          <span>Size: <strong className="text-black dark:text-white">{formatSize(response.size)}</strong></span>
        </div>
      </div>

      {/* Response Data Code block */}
      <div className="border-4 border-black bg-white dark:bg-neutral-950 relative overflow-hidden flex flex-col">
        <div className="bg-neutral-50 dark:bg-neutral-900 border-b-2 border-black p-2 flex justify-between items-center px-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Body</span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-slate-500 hover:text-black dark:hover:text-white p-1 flex items-center gap-1.5 font-bold uppercase text-[9px] tracking-wider"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-500" /> Copied!
              </>
            ) : (
              <>
                <Copy size={12} /> Copy
              </>
            )}
          </button>
        </div>

        <pre className="p-4 overflow-y-auto h-[250px] font-mono text-xs text-left leading-relaxed text-black dark:text-white whitespace-pre-wrap break-all" data-lenis-prevent>
          {formattedData || <span className="italic text-slate-400">Empty Response Body</span>}
        </pre>
      </div>
    </div>
  );
}
