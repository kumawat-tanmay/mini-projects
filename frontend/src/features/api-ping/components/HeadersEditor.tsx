import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface HeaderItem {
  key: string;
  value: string;
}

interface HeadersEditorProps {
  headers: HeaderItem[];
  onChange: (headers: HeaderItem[]) => void;
}

export default function HeadersEditor({ headers, onChange }: HeadersEditorProps) {
  const handleAdd = () => {
    onChange([...headers, { key: '', value: '' }]);
  };

  const handleRemove = (index: number) => {
    const nextHeaders = [...headers];
    nextHeaders.splice(index, 1);
    onChange(nextHeaders);
  };

  const handleUpdate = (index: number, field: 'key' | 'value', value: string) => {
    const nextHeaders = [...headers];
    nextHeaders[index][field] = value;
    onChange(nextHeaders);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-black uppercase tracking-wider text-xs text-black dark:text-white">Headers</h4>
        <button
          type="button"
          onClick={handleAdd}
          className="bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-black uppercase text-[10px] tracking-wider px-2 py-1.5 border-2 border-black flex items-center gap-1 active:translate-y-0.5 active:translate-x-0.5 transition-transform"
        >
          <Plus size={12} strokeWidth={3} /> Add Header
        </button>
      </div>

      <div className="border-4 border-black bg-white dark:bg-neutral-800 flex flex-col h-[200px]">
        {/* Fixed Header Row */}
        <div className="bg-neutral-100 dark:bg-neutral-900 border-b-4 border-black text-[10px] font-black uppercase tracking-widest text-black dark:text-white flex shrink-0 select-none">
          <div className="p-2.5 border-r-2 border-black w-5/12">Key</div>
          <div className="p-2.5 border-r-2 border-black w-5/12">Value</div>
          <div className="p-2.5 text-center w-2/12">Action</div>
        </div>

        {/* Scrollable Data Body */}
        <div className="flex-1 overflow-y-auto" data-lenis-prevent>
          {headers.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider h-full flex items-center justify-center">
              No headers defined (Default headers will be set by server)
            </div>
          ) : (
            <div className="divide-y-2 divide-slate-100 dark:divide-neutral-700">
              {headers.map((h, i) => (
                <div key={i} className="flex items-center">
                  <div className="p-1 border-r-2 border-black w-5/12">
                    <input
                      type="text"
                      value={h.key}
                      placeholder="e.g. Content-Type"
                      onChange={(e) => handleUpdate(i, 'key', e.target.value)}
                      className="w-full p-1.5 font-mono text-xs bg-transparent outline-none text-black dark:text-white"
                    />
                  </div>
                  <div className="p-1 border-r-2 border-black w-5/12">
                    <input
                      type="text"
                      value={h.value}
                      placeholder="e.g. application/json"
                      onChange={(e) => handleUpdate(i, 'value', e.target.value)}
                      className="w-full p-1.5 font-mono text-xs bg-transparent outline-none text-black dark:text-white"
                    />
                  </div>
                  <div className="p-1 text-center w-2/12 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemove(i)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
