"use client";

import React, { useState, useEffect } from 'react';
import { 
  fetchSavedRequests, 
  saveRequest, 
  deleteRequest, 
  proxyRequest, 
  SavedRequest, 
  ProxyResponse 
} from '@/features/api-ping/api';
import SidebarHistory from '@/features/api-ping/components/SidebarHistory';
import HeadersEditor from '@/features/api-ping/components/HeadersEditor';
import BodyEditor from '@/features/api-ping/components/BodyEditor';
import ResponseViewer from '@/features/api-ping/components/ResponseViewer';
import { Send, Save, Plus } from 'lucide-react';
import PromptModal from '@/components/ui/PromptModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { disintegrate } from '@/utils/thanosSnap';

export default function ApiPingPage() {
  const [requests, setRequests] = useState<SavedRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Request form state
  const [name, setName] = useState('New Request');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([]);
  const [body, setBody] = useState('');

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ProxyResponse | null>(null);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  // Custom modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'save' | 'rename'>('save');
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [modalDefaultValue, setModalDefaultValue] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Load saved requests on mount
  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setSidebarLoading(true);
      const data = await fetchSavedRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSidebarLoading(false);
    }
  };

  const handleSelectRequest = (req: SavedRequest) => {
    setSelectedId(req._id);
    setName(req.name);
    setUrl(req.url);
    setMethod(req.method);
    setHeaders(req.headers || []);
    setBody(req.body || '');
    setResponse(null);
  };

  const handleNewRequest = () => {
    setSelectedId(null);
    setName('New Request');
    setUrl('');
    setMethod('GET');
    setHeaders([]);
    setBody('');
    setResponse(null);
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (!selectedId || name === 'New Request') {
      setModalMode('save');
      setModalDefaultValue(name);
      setModalOpen(true);
    } else {
      executeSave(name);
    }
  };

  const executeSave = async (requestName: string) => {
    try {
      const saved = await saveRequest({
        id: selectedId || undefined,
        name: requestName,
        url,
        method,
        headers,
        body,
      });
      
      setName(requestName);
      await loadRequests();
      setSelectedId(saved._id);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameClick = (id: string, currentName: string) => {
    setModalMode('rename');
    setRenameTargetId(id);
    setModalDefaultValue(currentName);
    setModalOpen(true);
  };

  const executeRename = async (newName: string) => {
    if (!renameTargetId) return;
    try {
      const requestToRename = requests.find(r => r._id === renameTargetId);
      if (!requestToRename) return;

      await saveRequest({
        id: renameTargetId,
        name: newName,
        url: requestToRename.url,
        method: requestToRename.method,
        headers: requestToRename.headers,
        body: requestToRename.body
      });
      
      if (selectedId === renameTargetId) {
        setName(newName);
      }
      
      await loadRequests();
      setModalOpen(false);
      setRenameTargetId(null);
    } catch (err) {
      console.error('Failed to rename request:', err);
    }
  };

  const handleModalConfirm = (value: string) => {
    if (modalMode === 'save') {
      executeSave(value);
    } else {
      executeRename(value);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);

    try {
      const element = document.getElementById(`api-request-item-${id}`);
      if (element) {
        await disintegrate(element, async () => {
          await deleteRequest(id);
          if (selectedId === id) {
            handleNewRequest();
          }
          await loadRequests();
        });
      } else {
        await deleteRequest(id);
        if (selectedId === id) {
          handleNewRequest();
        }
        await loadRequests();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleSend = async () => {
    if (!url.trim()) return;
    
    setLoading(true);
    setResponse(null);
    
    try {
      const res = await proxyRequest({
        url,
        method,
        headers,
        body,
      });
      setResponse(res);
    } catch (err: any) {
      setResponse({
        status: 500,
        statusText: 'Client Fetch Error',
        headers: {},
        data: err.message || 'Unable to complete fetch proxy request',
        time: 0,
        size: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-6">
      
      {/* Sidebar Collections History */}
      <SidebarHistory
        requests={requests}
        selectedId={selectedId}
        onSelect={handleSelectRequest}
        onDelete={handleDeleteClick}
        onRename={handleRenameClick}
        onNewRequest={handleNewRequest}
      />

      {/* Main Request Console */}
      <div className="flex-1 space-y-6">
        
        {/* Request Input Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex border-4 border-black bg-white dark:bg-neutral-900 overflow-hidden">
            
            {/* Method Select */}
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white px-3 font-black text-xs uppercase border-r-4 border-black outline-none h-12"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>

            {/* URL Input */}
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter request URL (e.g. https://api.github.com/users)"
              className="flex-1 px-4 font-mono text-xs outline-none bg-transparent text-black dark:text-white"
            />
          </div>

          <div className="flex gap-2 shrink-0">
            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={loading || !url.trim()}
              className="flex-1 sm:flex-initial bg-emerald-400 hover:bg-emerald-500 text-black border-4 border-black px-6 h-12 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:translate-y-1 active:translate-x-1 active:shadow-none shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <Send size={14} strokeWidth={3} />
              Send
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveClick}
              disabled={!url.trim()}
              className="flex-1 sm:flex-initial bg-yellow-400 hover:bg-yellow-500 text-black border-4 border-black px-6 h-12 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:translate-y-1 active:translate-x-1 active:shadow-none shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <Save size={14} strokeWidth={3} />
              Save
            </button>
          </div>
        </div>

        {/* Tab-like Editors (Headers & Body) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <HeadersEditor
            headers={headers}
            onChange={setHeaders}
          />
          <BodyEditor
            body={body}
            onChange={setBody}
          />
        </div>

        {/* Response Viewer */}
        <ResponseViewer
          response={response}
          loading={loading}
        />

      </div>

      {/* Custom Brutalist Save/Rename Modal */}
      <PromptModal
        isOpen={modalOpen}
        title={modalMode === 'save' ? 'Save Request' : 'Rename Request'}
        defaultValue={modalDefaultValue}
        onConfirm={handleModalConfirm}
        onCancel={() => setModalOpen(false)}
      />

      {/* Custom Confirm Delete Modal */}
      {deleteTargetId && (
        <ConfirmModal
          title="Delete Request"
          description="Are you sure you want to permanently delete this request? This action cannot be undone."
          confirmText="Delete"
          onConfirm={executeDelete}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}
