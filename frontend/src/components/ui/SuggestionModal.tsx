"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuggestionModal({ isOpen, onClose }: SuggestionModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !title || !description) {
      toast.error('Please fill in all required fields!');
      return;
    }
    
    setIsSubmitting(true);

    try {
      await fetch(
        'https://script.google.com/macros/s/AKfycby2rSQYuhp3g_sSoFuhoCSxDtuUYQqie2lhKrOgYgrcEskekKTkgdWsJNvRW0m5FHOj/exec',
        {
          method: 'POST',
          mode: 'no-cors', // Required for Google Apps Script unless complex CORS setup
          headers: {
            'Content-Type': 'text/plain', // Avoid preflight requests
          },
          body: JSON.stringify({ name, email, title, description }),
        }
      );

      toast.success('Awesome idea! Thanks for the suggestion!');
      
      // Reset and close
      setName('');
      setEmail('');
      setTitle('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast.error('Failed to submit suggestion. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 border-4 border-black p-8 max-w-lg w-full mx-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black dark:text-white hover:opacity-60 transition-opacity"
        >
          <X size={24} strokeWidth={3} />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-yellow-400 text-black border-2 border-black">
            <Sparkles size={24} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">
            Suggest An Idea
          </h2>
        </div>

        <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-6 italic border-l-4 border-yellow-400 pl-3">
          "Tell me more ideas so I can add them here which help you everyday!"
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-black dark:text-white mb-1">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-neutral-700 p-2 font-bold focus:outline-none focus:border-yellow-400 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-black dark:text-white mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-neutral-700 p-2 font-bold focus:outline-none focus:border-yellow-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-black dark:text-white mb-1">
              Suggestion Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Habit Tracker"
              className="w-full bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-neutral-700 p-2 font-bold focus:outline-none focus:border-yellow-400 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-black dark:text-white mb-1">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your idea and how it would help you..."
              rows={4}
              className="w-full bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-neutral-700 p-2 font-bold focus:outline-none focus:border-yellow-400 transition-colors resize-none"
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 border-4 border-black font-black uppercase tracking-widest text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-yellow-400 border-4 border-black text-black font-black uppercase tracking-widest text-sm hover:bg-yellow-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} strokeWidth={3} className="animate-spin" />
                  Sending...
                </>
              ) : (
                'Submit Idea'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
