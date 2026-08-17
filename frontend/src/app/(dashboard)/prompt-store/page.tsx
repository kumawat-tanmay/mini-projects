"use client";

import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { usePrompts } from '@/features/prompt-store/usePrompts';
import PromptToolbar from '@/features/prompt-store/components/PromptToolbar';
import PromptCard from '@/features/prompt-store/components/PromptCard';
import PromptEditor from '@/features/prompt-store/components/PromptEditor';
import type { Prompt } from '@/features/prompt-store/types';
import { disintegrate } from '@/utils/thanosSnap';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { CardSkeleton } from '@/components/ui/CardSkeleton';

gsap.registerPlugin(useGSAP);

export default function PromptStorePage() {
  const {
    prompts,
    loading,
    createPrompt,
    editPrompt,
    removePrompt,
    removeAllPrompts,
    uploadFile,
  } = usePrompts();
  
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [draftPrompt, setDraftPrompt] = useState<Prompt | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial staggered entrance animation
  useGSAP(() => {
    if (!loading && prompts.length > 0 && containerRef.current) {
      gsap.fromTo(
        '.prompt-card-wrapper',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.05,
          ease: 'power3.out',
          clearProps: 'all',
        }
      );
    }
  }, [loading]); // Only run on initial load

  return (
    <div className="w-full min-h-full pb-20 relative">
      <PromptToolbar
        promptCount={prompts.length}
        onCreatePrompt={() => {
          setDraftPrompt({ _id: 'draft', title: '', content: '' } as Prompt);
          setSelectedPromptId('draft');
        }}
        onUploadFile={async (file) => {
          const newPrompt = await uploadFile(file);
          if (newPrompt) {
            setDraftPrompt({ _id: 'draft', title: newPrompt.title, content: newPrompt.content } as Prompt);
            setSelectedPromptId('draft');
          }
        }}
        isUploading={loading && prompts.length === 0}
        onDeleteAll={() => setShowDeleteModal(true)}
      />

      {loading && prompts.length === 0 && (
        <CardSkeleton />
      )}

      {!loading && prompts.length === 0 && (
        <div className="w-full flex flex-col items-center justify-center py-20 text-center border-4 border-dashed border-black/20 dark:border-neutral-700/20">
          <h2 className="text-2xl font-black uppercase tracking-widest text-black/40 dark:text-white/40 mb-4">No Prompts Yet</h2>
          <p className="text-black/60 dark:text-white/60 mb-8 max-w-md">
            Click 'New Prompt' to create one, or upload a .txt, .md, or .pdf file to automatically extract its contents into a prompt!
          </p>
        </div>
      )}

      <div 
        ref={containerRef}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-max"
      >
        {prompts.map((prompt) => (
          <div key={prompt._id} className="prompt-card-wrapper">
            <PromptCard
              prompt={prompt}
              isActive={selectedPromptId === prompt._id}
              onClick={(p) => {
                setDraftPrompt(null);
                setSelectedPromptId(p._id);
              }}
              onDelete={(id) => {
                if (selectedPromptId === id) setSelectedPromptId(null);
                removePrompt(id);
              }}
            />
          </div>
        ))}
      </div>

      {/* Editor Side Panel */}
      <PromptEditor
        prompt={draftPrompt || prompts.find(p => p._id === selectedPromptId) || null}
        onSave={async (id, updates) => {
          if (id === 'draft') {
            await createPrompt({ title: updates.title || '', content: updates.content || '' });
          } else {
            editPrompt(id, updates);
          }
          setDraftPrompt(null);
          setSelectedPromptId(null);
        }}
        onClose={() => {
          setDraftPrompt(null);
          setSelectedPromptId(null);
        }}
        onDelete={async (id) => {
          setDraftPrompt(null);
          setSelectedPromptId(null);
          
          const element = document.getElementById(`prompt-card-${id}`);
          if (element) {
            await disintegrate(element, () => {
              removePrompt(id);
            });
          } else {
            removePrompt(id);
          }
        }}
      />

      {/* Delete All Modal */}
      {showDeleteModal && (
        <ConfirmModal
          title="Delete All Prompts"
          description={
            <>
              This will permanently delete <span className="text-red-500 font-black">{prompts.length}</span> prompt{prompts.length !== 1 ? 's' : ''}. 
              This action cannot be undone.
            </>
          }
          confirmText="Delete All"
          onConfirm={() => {
            setShowDeleteModal(false);
            removeAllPrompts();
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
