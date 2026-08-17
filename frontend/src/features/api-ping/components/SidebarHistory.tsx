import React from 'react';
import { SavedRequest } from '../api';
import { Trash2, Plus, Globe, Edit3 } from 'lucide-react';

interface SidebarHistoryProps {
  requests: SavedRequest[];
  selectedId: string | null;
  onSelect: (req: SavedRequest) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, currentName: string) => void;
  onNewRequest: () => void;
}

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET': return 'bg-emerald-400 text-black';
    case 'POST': return 'bg-yellow-400 text-black';
    case 'PUT': return 'bg-blue-400 text-black';
    case 'DELETE': return 'bg-red-400 text-white';
    case 'PATCH': return 'bg-purple-400 text-black';
    default: return 'bg-slate-400 text-black';
  }
};

export default function SidebarHistory({
  requests,
  selectedId,
  onSelect,
  onDelete,
  onRename,
  onNewRequest
}: SidebarHistoryProps) {
  return (
    <div className="w-full md:w-64 shrink-0 border-4 border-black bg-white dark:bg-neutral-900 flex flex-col h-[calc(100vh-200px)] md:h-auto min-h-[300px]">
      {/* Sidebar Header */}
      <div className="p-4 border-b-4 border-black bg-neutral-100 dark:bg-neutral-800 flex justify-between items-center">
        <h3 className="font-black uppercase tracking-widest text-sm text-black dark:text-white">Collections</h3>
        <button
          onClick={onNewRequest}
          className="bg-cyan-400 hover:bg-cyan-500 text-black p-1.5 border-2 border-black font-black flex items-center gap-1 active:translate-y-0.5 active:translate-x-0.5 transition-transform"
          title="New Request"
        >
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {requests.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider text-xs">
            <Globe className="mx-auto mb-2 opacity-55" size={24} />
            No saved requests
          </div>
        ) : (
          requests.map((req) => {
            const isSelected = selectedId === req._id;
            return (
              <div
                key={req._id}
                id={`api-request-item-${req._id}`}
                onClick={() => onSelect(req)}
                className={`relative group flex items-center justify-between p-2.5 border-2 border-black cursor-pointer select-none transition-all active:translate-y-0.5 active:translate-x-0.5 ${
                  isSelected 
                    ? 'bg-yellow-100 dark:bg-yellow-950 border-yellow-500 dark:border-yellow-400' 
                    : 'bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden w-full">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 border border-black uppercase shrink-0 ${getMethodColor(req.method)}`}>
                    {req.method}
                  </span>
                  <div className="flex flex-col overflow-hidden text-left">
                    <span className="font-bold text-xs truncate text-black dark:text-white uppercase tracking-tight">
                      {req.name || 'Untitled Request'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-neutral-400 truncate font-mono">
                      {req.url}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRename(req._id, req.name);
                    }}
                    className="text-slate-400 hover:text-cyan-500 p-0.5 rounded-sm"
                    title="Rename Request"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(req._id);
                    }}
                    className="text-slate-400 hover:text-red-500 p-0.5 rounded-sm"
                    title="Delete Request"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
