"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  getLinkedInAuthUrl,
  getLinkedInStatus,
  disconnectLinkedIn,
  generateLinkedInPost,
  publishToLinkedIn,
  saveProviderApiKey,
  deleteProviderApiKey,
  setDefaultAIProvider,
  LinkedInProfile,
  PostHistoryItem,
  AIProvider,
} from '@/features/linkedin/api';
import {
  Linkedin,
  Sparkles,
  Send,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Key,
  ExternalLink,
  AlertTriangle,
  UserCheck,
  Calendar,
  Layers,
  Flame,
  BookOpen,
  Shield,
  Zap,
  Star,
  X,
  Image as ImageIcon,
  Download,
  ThumbsUp,
  MessageSquare,
  Repeat,
  ArrowUp,
} from 'lucide-react';

const PROMPT_SUGGESTIONS = [
  {
    title: 'Hot Take',
    prompt: 'Write a bold, contrarian post on why 80% of architecture meetings could be an async PR comment, with 3 real lessons and a brutalist diagram visual',
  },
  {
    title: 'Career Story',
    prompt: 'Write an authentic storytelling post about going from a stressed junior engineer to a calm staff engineer by mastering focus, with an executive workspace visual',
  },
  {
    title: 'Tech Breakdown',
    prompt: 'Write a step-by-step breakdown of how to design resilient microservices without over-engineering, with 4 actionable rules and a clean infographic visual',
  },
  {
    title: 'Future of AI',
    prompt: 'Write an insightful thought-leadership post about why AI agentic pairs will make software engineers 10x more strategic, with a modern 3D abstract visual',
  },
];

const STYLE_SUGGESTIONS = [
  { label: 'Auto (AI Directs)', value: '' },
  { label: 'Photorealistic', value: 'Cinematic photorealistic 35mm photography, warm golden hour ambient lighting' },
  { label: '3D Isometric', value: '3D isometric render, vibrant geometric shapes, glass and metallic textures' },
  { label: 'Dark Surrealism', value: 'Dark cinematic surrealism, obsidian reflections, glowing indigo and cyan accents' },
  { label: 'Minimalist Vector', value: 'Clean flat vector art, bold negative space, high contrast, elegant palette' },
  { label: 'Cyberpunk Tech', value: 'Futuristic digital cyberpunk, neon holographic edge lighting, circuit motifs' },
  { label: 'Hand-Drawn Sketch', value: 'Architectural charcoal and ink blueprint sketch, textured parchment' },
];

const PROVIDER_INFO: Record<AIProvider, { name: string; color: string; freeTier: string; keyPrefix: string; getKeyUrl: string }> = {
  gemini: {
    name: 'Google Gemini',
    color: '#4285F4',
    freeTier: '1,500 free req/day — no credit card',
    keyPrefix: 'AIza...',
    getKeyUrl: 'https://aistudio.google.com/apikey',
  },
  openai: {
    name: 'OpenAI (ChatGPT)',
    color: '#10A37F',
    freeTier: 'Pay-as-you-go — requires billing setup',
    keyPrefix: 'sk-...',
    getKeyUrl: 'https://platform.openai.com/api-keys',
  },
  groq: {
    name: 'Groq (Llama 3.1)',
    color: '#F55036',
    freeTier: 'Free tier — 30 req/min, no credit card',
    keyPrefix: 'gsk_...',
    getKeyUrl: 'https://console.groq.com/keys',
  },
};

const ALL_PROVIDERS: AIProvider[] = ['gemini', 'openai', 'groq'];

export default function LinkedInPage() {
  // Connection State
  const [isConnected, setIsConnected] = useState(false);
  const [profile, setProfile] = useState<LinkedInProfile | null>(null);
  const [configuredProviders, setConfiguredProviders] = useState<AIProvider[]>([]);
  const [defaultProvider, setDefaultProvider] = useState<AIProvider>('gemini');
  const [postHistory, setPostHistory] = useState<PostHistoryItem[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [activeTab, setActiveTab] = useState<'studio' | 'history'>('studio');
  const [historySearch, setHistorySearch] = useState('');

  // Generator Prompt State
  const [topic, setTopic] = useState('');
  const [includeImage, setIncludeImage] = useState(true);
  const [visualStyle, setVisualStyle] = useState('');
  const [visualDirection, setVisualDirection] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImgLoading, setIsImgLoading] = useState(false);
  const [isImgError, setIsImgError] = useState(false);
  const [generatorNote, setGeneratorNote] = useState('');

  // Editor & Visual State
  const [postText, setPostText] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedImagePrompt, setGeneratedImagePrompt] = useState<string | null>(null);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessUrl, setPublishSuccessUrl] = useState<string | null>(null);
  const [publishError, setPublishError] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Provider Vault Modal
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultKeyInputs, setVaultKeyInputs] = useState<Record<AIProvider, string>>({ gemini: '', openai: '', groq: '' });
  const [vaultSaving, setVaultSaving] = useState<AIProvider | null>(null);
  const [vaultDeleting, setVaultDeleting] = useState<AIProvider | null>(null);
  const [vaultMessage, setVaultMessage] = useState('');

  const filteredHistory = postHistory.filter((item) => {
    if (!historySearch.trim()) return true;
    return item.text.toLowerCase().includes(historySearch.toLowerCase());
  });

  // Lock background scrolling when vault modal is open
  useEffect(() => {
    if (isVaultOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isVaultOpen]);

  // Fetch initial connection status
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const data = await getLinkedInStatus();
      setIsConnected(data.isConnected);
      setProfile(data.profile);
      setConfiguredProviders(data.configuredProviders || []);
      setDefaultProvider(data.defaultProvider || 'gemini');
      setPostHistory(data.postHistory || []);
    } catch (err) {
      console.error('Failed to fetch LinkedIn status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Connect to LinkedIn via OAuth
  const handleConnect = async () => {
    try {
      const redirectUri = window.location.origin + '/linkedin-callback';
      const { authUrl } = await getLinkedInAuthUrl(redirectUri);
      window.location.href = authUrl;
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate LinkedIn OAuth');
    }
  };

  // Disconnect LinkedIn
  const handleDisconnect = async () => {
    try {
      await disconnectLinkedIn();
      setIsConnected(false);
      setProfile(null);
      toast.info('LinkedIn account disconnected.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect LinkedIn account.');
    }
  };

  // Generate Post with AI (Text + Visuals)
  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.warning('Please enter a prompt or idea to generate a post.');
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratorNote('');
      setPublishError('');
      setPublishSuccessUrl(null);

      const res = await generateLinkedInPost({
        topic,
        includeImage,
        visualStyle: visualStyle.trim() || undefined,
        provider: configuredProviders.includes(defaultProvider) ? defaultProvider : undefined,
      });

      setPostText(res.content);
      if (res.visualDirection) {
        setVisualDirection(res.visualDirection);
      }
      if (res.imageUrl) {
        setIsImgLoading(true);
        setIsImgError(false);
        setGeneratedImageUrl(res.imageUrl);
        setGeneratedImagePrompt(res.imagePrompt || null);
      } else if (!includeImage) {
        setGeneratedImageUrl(null);
      }
      if (res.note) {
        setGeneratorNote(res.note);
        toast.info(res.note);
      } else {
        toast.success('Post & bespoke visual generated!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate post.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate only the image
  const handleRegenerateImage = async () => {
    if (!topic.trim()) {
      toast.warning('Please enter a prompt or topic first.');
      return;
    }
    try {
      setIsRegeneratingImage(true);
      setIsImgError(false);
      setIsImgLoading(true);
      const res = await generateLinkedInPost({
        topic,
        includeImage: true,
        visualStyle: visualStyle.trim() || undefined,
        provider: configuredProviders.includes(defaultProvider) ? defaultProvider : undefined,
      });
      if (res.imageUrl) {
        if (res.visualDirection) {
          setVisualDirection(res.visualDirection);
        }
        setGeneratedImageUrl(res.imageUrl);
        setGeneratedImagePrompt(res.imagePrompt || null);
      }
      toast.success('New visual variation generated!');
    } catch (err: any) {
      setIsImgLoading(false);
      setIsImgError(true);
      toast.error(err.message || 'Failed to regenerate image.');
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  // Download Generated Image with Watermark Removal
  const handleDownloadImage = async () => {
    if (!generatedImageUrl) return;
    try {
      const a = document.createElement('a');
      a.href = generatedImageUrl;
      a.download = `linkedin-visual-${Date.now()}.png`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Image download started!');
    } catch (err) {
      window.open(generatedImageUrl, '_blank');
    }
  };

  // Publish Post
  const handlePublish = async () => {
    if (!postText.trim()) {
      toast.warning('Post content cannot be empty.');
      return;
    }

    if (!isConnected) {
      toast.warning('Please connect your LinkedIn account before publishing.');
      return;
    }

    try {
      setIsPublishing(true);
      setPublishError('');
      setPublishSuccessUrl(null);

      const res = await publishToLinkedIn(postText, generatedImageUrl || undefined);
      setPublishSuccessUrl(res.postUrl || 'https://www.linkedin.com/feed/');
      toast.success('Post successfully published to your LinkedIn profile!');
      
      // Refresh post history
      await loadStatus();
    } catch (err: any) {
      console.error('Publishing failed:', err);
      setPublishError(err.message || 'Failed to publish post to LinkedIn.');
      toast.error(err.message || 'Failed to publish post to LinkedIn.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Copy to Clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(postText);
    setIsCopied(true);
    toast.success('Post text copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // ─── Provider Vault Handlers ───
  const handleSaveProviderKey = async (provider: AIProvider) => {
    const key = vaultKeyInputs[provider];
    if (!key.trim()) {
      toast.warning('Please enter an API key.');
      return;
    }

    try {
      setVaultSaving(provider);
      setVaultMessage('');
      await saveProviderApiKey(provider, key.trim());
      setVaultKeyInputs((prev) => ({ ...prev, [provider]: '' }));
      const msg = `✓ ${PROVIDER_INFO[provider].name} key encrypted & saved!`;
      setVaultMessage(msg);
      toast.success(msg);
      // Refresh configured providers
      if (!configuredProviders.includes(provider)) {
        setConfiguredProviders((prev) => [...prev, provider]);
      }
      setTimeout(() => setVaultMessage(''), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save API key.');
    } finally {
      setVaultSaving(null);
    }
  };

  const handleDeleteProviderKey = async (provider: AIProvider) => {
    try {
      setVaultDeleting(provider);
      setVaultMessage('');
      await deleteProviderApiKey(provider);
      setConfiguredProviders((prev) => prev.filter((p) => p !== provider));
      const msg = `${PROVIDER_INFO[provider].name} key deleted.`;
      setVaultMessage(msg);
      toast.info(msg);
      setTimeout(() => setVaultMessage(''), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete API key.');
    } finally {
      setVaultDeleting(null);
    }
  };

  const handleSetDefault = async (provider: AIProvider) => {
    try {
      await setDefaultAIProvider(provider);
      setDefaultProvider(provider);
      toast.success(`Default provider set to ${PROVIDER_INFO[provider].name}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to set default provider.');
    }
  };

  const characterCount = postText.length;
  const maxCharacters = 3000;
  const wordCount = postText.trim() ? postText.trim().split(/\s+/).length : 0;
  const hashtagsCount = (postText.match(/#[a-zA-Z0-9_]+/g) || []).length;

  // Active provider label for the generate button
  const activeProviderLabel = configuredProviders.includes(defaultProvider)
    ? PROVIDER_INFO[defaultProvider].name.toUpperCase()
    : configuredProviders.length > 0
    ? PROVIDER_INFO[configuredProviders[0]].name.toUpperCase()
    : 'TEMPLATE ENGINE';

  return (
    <div className="w-full min-h-screen flex flex-col gap-6 select-none pb-12">
      {/* Top Banner: Connection Status & Quick Settings */}
      <section className="w-full p-4 sm:p-6 border-4 border-black dark:border-white bg-white dark:bg-black shadow-[6px_6px_0px_#000000] dark:shadow-[6px_6px_0px_#ffffff] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0077B5] border-2 border-black text-white">
            <Linkedin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-mono font-black uppercase tracking-wider text-base sm:text-lg text-black dark:text-white">
              LINKEDIN AUTO-POSTER
            </h1>
            <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
              AI-driven post generator with 1-click publishing to your personal LinkedIn feed.
            </p>
          </div>
        </div>

        {/* Status Profile / Connect Button */}
        <div className="flex items-center gap-2.5">
          {isLoadingStatus ? (
            <div className="flex items-center gap-2 px-3 py-1.5 border-2 border-black font-mono text-xs uppercase font-bold bg-neutral-100">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> CHECKING STATUS...
            </div>
          ) : isConnected && profile ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 border-2 border-black dark:border-white bg-emerald-100 dark:bg-emerald-950/60">
                {profile.picture ? (
                  <img
                    src={profile.picture}
                    alt={profile.name}
                    className="w-6 h-6 rounded-full border border-black"
                  />
                ) : (
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
                <span className="font-mono font-black text-xs uppercase text-emerald-900 dark:text-emerald-200 truncate max-w-[140px]">
                  {profile.name}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <button
                onClick={handleDisconnect}
                className="p-1.5 border-2 border-black dark:border-white bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-mono font-bold"
                title="Disconnect Account"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-[#0077B5] hover:bg-[#006097] text-white font-mono font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <Linkedin className="w-4 h-4" />
              CONNECT LINKEDIN ACCOUNT
            </button>
          )}

          {/* Provider Vault Button */}
          <button
            onClick={() => setIsVaultOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 border-2 border-black dark:border-white bg-amber-400 hover:bg-amber-300 text-black font-mono font-black text-xs uppercase shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff] active:translate-x-0.5 active:translate-y-0.5"
            title="Configure AI Provider Keys"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">AI VAULT</span>
            {configuredProviders.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-black text-white text-[9px] font-black">
                {configuredProviders.length}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* View Navigation: Post Studio vs Published Archive */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-black dark:border-white pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 px-5 py-2.5 border-3 border-black dark:border-white font-mono font-black text-xs uppercase tracking-wider transition-all ${
              activeTab === 'studio'
                ? 'bg-amber-400 text-black shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff]'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>POST STUDIO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-5 py-2.5 border-3 border-black dark:border-white font-mono font-black text-xs uppercase tracking-wider transition-all ${
              activeTab === 'history'
                ? 'bg-amber-400 text-black shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff]'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-cyan-500" />
            <span>VIEW ALL POSTS ({postHistory.length})</span>
          </button>
        </div>

        {activeTab === 'history' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search published archive..."
              className="w-full sm:w-64 px-3 py-1.5 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 font-mono text-xs text-black dark:text-white placeholder:text-neutral-400 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Mode A: Main Split-Screen Workspace (POST STUDIO) */}
      {activeTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Generator Controls (5 cols) */}
          <section className="lg:col-span-5 p-5 border-4 border-black dark:border-white bg-white dark:bg-black shadow-[6px_6px_0px_#000000] dark:shadow-[6px_6px_0px_#ffffff] flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="font-mono font-black uppercase text-sm text-black dark:text-white">
                  AI PROMPT STUDIO
                </h2>
              </div>
              <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-black dark:border-white text-black dark:text-white">
                CHAT & GENERATE
              </span>
            </div>

            {/* ChatGPT / Gemini Style Chat Box */}
            <div className="border-4 border-black dark:border-white bg-neutral-50 dark:bg-neutral-900 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff] flex flex-col focus-within:ring-2 focus-within:ring-amber-400 transition-all">
              {/* Prompt Textarea */}
              <div className="p-3">
                <textarea
                  rows={5}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!isGenerating && topic.trim()) {
                        handleGenerate();
                      }
                    }
                  }}
                  placeholder="Ask AI to write anything... e.g. Write a viral post about why AI coding tools won't replace software engineers but will replace developers who don't adapt, with 3 actionable lessons..."
                  className="w-full bg-transparent font-mono text-xs text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Bottom Toolbar inside Chat Box */}
              <div className="flex flex-col gap-2 p-2.5 border-t-2 border-black dark:border-white/20 bg-white dark:bg-black">
                {/* Image Toggle, Custom Art Style Input, and Submit Button */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
                    <button
                      type="button"
                      onClick={() => setIncludeImage(!includeImage)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 border-2 border-black dark:border-white font-mono text-[10px] font-black uppercase transition-all shrink-0 ${
                        includeImage
                          ? 'bg-emerald-400 text-black shadow-[2px_2px_0px_#000000]'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                      }`}
                      title="Toggle image generation"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>{includeImage ? 'IMAGE: ON' : 'IMAGE: OFF'}</span>
                    </button>

                    {includeImage && (
                      <div className="flex items-center gap-1 flex-1 min-w-[180px]">
                        <input
                          type="text"
                          value={visualStyle}
                          onChange={(e) => setVisualStyle(e.target.value)}
                          placeholder="Visual style / vibe (e.g. 3D render, anime, photorealistic, or leave blank for AI)"
                          className="w-full px-2 py-1 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 text-black dark:text-white font-mono text-[10px] placeholder:text-neutral-400 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Right Control: Submit Button (Gemini / ChatGPT Arrow Icon) */}
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating || !topic.trim()}
                    className="p-2 border-2 border-black dark:border-white bg-amber-400 hover:bg-amber-300 text-black font-mono font-black shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                    title="Press Enter to generate post & visual"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <ArrowUp className="w-4 h-4 text-black stroke-[3]" />
                    )}
                  </button>
                </div>

                {/* Quick Style Inspiration Chips */}
                {includeImage && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[9px] font-mono scrollbar-none">
                    <span className="text-neutral-500 font-bold uppercase shrink-0">STYLES:</span>
                    {STYLE_SUGGESTIONS.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setVisualStyle(s.value)}
                        className={`px-2 py-0.5 border border-black dark:border-white shrink-0 font-bold uppercase transition-all ${
                          visualStyle === s.value
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white hover:bg-amber-300 hover:text-black'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Keyboard Hint */}
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 px-1">
              <span>Press <kbd className="px-1.5 py-0.5 border border-black dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 font-bold">Enter ↵</kbd> to generate</span>
              <span><kbd className="px-1.5 py-0.5 border border-black dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 font-bold">Shift + Enter</kbd> for new line</span>
            </div>

            {/* Quick Prompt Ideas (ChatGPT / Gemini Suggestion Chips) */}
            <div className="flex flex-col gap-2 pt-2 border-t-2 border-black dark:border-white">
              <span className="font-mono text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> QUICK PROMPT INSPIRATIONS
              </span>
              <div className="flex flex-col gap-1.5">
                {PROMPT_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTopic(item.prompt)}
                    className="p-2 text-left border-2 border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white bg-neutral-50 dark:bg-neutral-900/50 hover:bg-amber-50 dark:hover:bg-neutral-800 font-mono text-[11px] text-black dark:text-white transition-all flex items-start gap-2"
                  >
                    <span className="px-1.5 py-0.5 bg-black dark:bg-white text-white dark:text-black text-[9px] font-black uppercase shrink-0">
                      {item.title}
                    </span>
                    <span className="line-clamp-1 opacity-80">{item.prompt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Provider Badge & Vault Access */}
            <div className="flex items-center justify-between p-2.5 border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-bold uppercase text-[10px] text-black dark:text-white">
                  POWERED BY: {activeProviderLabel}
                </span>
              </div>
              <button
                onClick={() => setIsVaultOpen(true)}
                className="px-2 py-1 border border-black dark:border-white bg-white dark:bg-black font-bold uppercase text-[10px] hover:bg-amber-400 hover:text-black transition-colors"
              >
                CHANGE KEY ⚙️
              </button>
            </div>

            {generatorNote && (
              <p className="font-mono text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 border border-amber-400">
                💡 {generatorNote}
              </p>
            )}
          </section>

          {/* Right Column: Live Feed Preview & Publisher (7 cols) */}
          <section className="lg:col-span-7 flex flex-col gap-4">
            <div className="p-5 border-4 border-black dark:border-white bg-white dark:bg-black shadow-[6px_6px_0px_#000000] dark:shadow-[6px_6px_0px_#ffffff] flex flex-col gap-4">
              {/* Header with Live Character Metrics */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black dark:border-white pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <h2 className="font-mono font-black uppercase text-sm text-black dark:text-white">
                    LIVE LINKEDIN POST PREVIEW
                  </h2>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                  <span>WORDS: {wordCount}</span>
                  <span>•</span>
                  <span>TAGS: {hashtagsCount}</span>
                  <span>•</span>
                  <span className={characterCount > 2800 ? 'text-red-500 font-black' : ''}>
                    {characterCount} / {maxCharacters}
                  </span>
                </div>
              </div>

              {/* LinkedIn Simulated Post Card */}
              <div className="border-2 border-black dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-4 flex flex-col gap-3">
                {/* Author Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border-2 border-black dark:border-white bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-mono font-black text-sm uppercase overflow-hidden">
                    {profile?.picture ? (
                      <img src={profile.picture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      profile?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-xs uppercase text-black dark:text-white">
                        {profile?.name || 'Your Name'}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">• 1st</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Content Creator • Auto-Poster Studio
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400 flex items-center gap-1">
                      Just now • 🌐
                    </span>
                  </div>
                </div>

                {/* Editable Post Body Area */}
                <div className="relative">
                  <textarea
                    rows={8}
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder="Your generated LinkedIn post will appear here ready to review, format, or tweak..."
                    className="w-full p-3 border-2 border-black dark:border-neutral-700 bg-white dark:bg-black font-sans text-sm text-black dark:text-white focus:outline-none leading-relaxed"
                  />
                </div>

                {/* AI Visual Image Preview Box */}
                {generatedImageUrl ? (
                  <div className="border-2 border-black dark:border-white bg-black dark:bg-neutral-900 flex flex-col gap-0 overflow-hidden">
                    {/* Image Action Bar */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 border-b-2 border-black dark:border-white text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 font-bold uppercase text-black dark:text-white truncate max-w-[280px]">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">VISUAL: {visualDirection || visualStyle || 'AI Art Direction'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleRegenerateImage}
                          disabled={isRegeneratingImage}
                          className="flex items-center gap-1 px-2 py-0.5 border border-black dark:border-white bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 font-mono text-[10px] font-bold uppercase disabled:opacity-50"
                          title="Regenerate this image"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRegeneratingImage ? 'animate-spin' : ''}`} />
                          <span>RE-ROLL</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadImage}
                          className="flex items-center gap-1 px-2 py-0.5 border border-black dark:border-white bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 font-mono text-[10px] font-bold uppercase"
                          title="Download clean watermark-free image to your computer"
                        >
                          <Download className="w-3 h-3" />
                          <span>SAVE</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGeneratedImageUrl(null)}
                          className="p-1 border border-black dark:border-white bg-white dark:bg-neutral-900 text-neutral-500 hover:text-rose-600 font-mono text-[10px]"
                          title="Remove image from post"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {/* The Image Banner — with watermark-crop offset & Brutalist loading/error fallbacks */}
                    <div className="relative w-full aspect-[1.91/1] bg-neutral-950 flex items-center justify-center overflow-hidden">
                      <img
                        key={generatedImageUrl}
                        src={generatedImageUrl}
                        alt="Post Visual"
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          isImgLoading ? 'opacity-0' : 'opacity-100'
                        }`}
                        onLoad={() => {
                          setIsImgLoading(false);
                          setIsImgError(false);
                        }}
                        onError={() => {
                          setIsImgLoading(false);
                          setIsImgError(true);
                        }}
                      />
                      {isImgLoading && (
                        <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center gap-2.5 text-white font-mono text-xs font-bold uppercase p-4 text-center">
                          <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                          <span>RENDERING BESPOKE VISUAL...</span>
                          {visualDirection && (
                            <span className="text-[10px] text-neutral-400 max-w-sm normal-case font-normal">
                              {visualDirection}
                            </span>
                          )}
                        </div>
                      )}
                      {isImgError && (
                        <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center gap-2.5 text-white font-mono text-xs uppercase p-4 text-center">
                          <AlertTriangle className="w-7 h-7 text-rose-500" />
                          <span className="font-bold text-rose-400">VISUAL GENERATION TIMED OUT</span>
                          <span className="text-[10px] text-neutral-400">Network connection or CDN took too long</span>
                          <button
                            type="button"
                            onClick={handleRegenerateImage}
                            className="mt-1 px-3 py-1 bg-amber-400 text-black font-bold text-[10px] uppercase border-2 border-black hover:bg-amber-300"
                          >
                            RE-ROLL VISUAL ↺
                          </button>
                        </div>
                      )}
                      {isRegeneratingImage && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 text-white font-mono text-xs font-bold uppercase">
                          <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                          <span>CREATING NEW VISUAL...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : isGenerating && includeImage ? (
                  <div className="w-full aspect-[1.91/1] border-2 border-dashed border-black dark:border-white bg-neutral-100 dark:bg-neutral-800/50 flex flex-col items-center justify-center gap-2 font-mono text-xs font-bold uppercase text-neutral-500">
                    <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                    <span>AI CREATIVE AGENT IS CRAFTING YOUR VISUAL BANNER...</span>
                  </div>
                ) : null}

                {/* Simulated LinkedIn Engagement Bar */}
                <div className="flex items-center justify-between pt-2 border-t-2 border-neutral-200 dark:border-neutral-800 font-mono text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 py-1 px-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-[#0077B5]" />
                    <span>Like</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 py-1 px-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Comment</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 py-1 px-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>Repost</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 py-1 px-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>

                {/* Actions & Publish Button */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-black dark:border-white">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-2 border-2 border-black dark:border-white bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-black dark:text-white font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'COPIED!' : 'COPY TEXT'}</span>
                    </button>

                    {generatedImageUrl && (
                      <button
                        onClick={handleDownloadImage}
                        className="flex items-center gap-1.5 px-3 py-2 border-2 border-black dark:border-white bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-black dark:text-white font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden sm:inline">DOWNLOAD IMAGE</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="flex items-center gap-1.5 px-3 py-2 border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-300 hover:text-black text-black dark:text-white font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]"
                      title="View all published posts"
                    >
                      <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="hidden sm:inline">ARCHIVE</span>
                      <span className="px-1.5 py-0.2 bg-black text-white text-[9px] font-bold">
                        {postHistory.length}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing || !isConnected || !postText.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 border-3 border-black dark:border-white bg-[#0077B5] hover:bg-[#006097] text-white font-mono font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-40"
                    >
                      {isPublishing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> PUBLISHING TO FEED...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> PUBLISH TO LINKEDIN
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Feedback States */}
                {publishSuccessUrl && (
                  <div className="p-3 border-2 border-black bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span className="font-mono font-black text-xs uppercase text-emerald-900 dark:text-emerald-200">
                        SUCCESSFULLY PUBLISHED TO YOUR PROFILE!
                      </span>
                    </div>
                    <a
                      href={publishSuccessUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 border border-black bg-white text-black font-mono font-bold text-[10px] uppercase hover:bg-neutral-100"
                    >
                      VIEW ON LINKEDIN <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {publishError && (
                  <div className="p-3 border-2 border-black bg-rose-100 dark:bg-rose-950/60 flex items-center gap-2 text-rose-900 dark:text-rose-200 font-mono text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{publishError}</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Mode B: Dedicated Published Post Archive (VIEW ALL POSTS) */}
      {activeTab === 'history' && (
        <section className="w-full p-6 border-4 border-black dark:border-white bg-white dark:bg-black shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_#ffffff] flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black dark:border-white pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-500" />
              <h2 className="font-mono font-black uppercase text-base text-black dark:text-white">
                PUBLISHED POST ARCHIVE ({filteredHistory.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('studio')}
              className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black dark:border-white bg-amber-400 text-black font-mono font-black text-xs uppercase hover:bg-amber-300 shadow-[2px_2px_0px_#000000]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ CREATE NEW POST</span>
            </button>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-black dark:border-white bg-neutral-50 dark:bg-neutral-900 flex flex-col items-center justify-center gap-3 text-center">
              <Calendar className="w-10 h-10 text-neutral-400" />
              <h3 className="font-mono font-black uppercase text-sm text-black dark:text-white">
                {postHistory.length === 0 ? 'NO PUBLISHED POSTS YET' : 'NO MATCHING POSTS FOUND'}
              </h3>
              <p className="font-mono text-xs text-neutral-500 max-w-sm">
                {postHistory.length === 0
                  ? 'Connect your LinkedIn account and publish your first post to see your archive here.'
                  : 'Try searching for a different keyword.'}
              </p>
              {postHistory.length === 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('studio')}
                  className="mt-2 px-4 py-2 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black font-mono font-black text-xs uppercase shadow-[3px_3px_0px_#F59E0B]"
                >
                  GO TO POST STUDIO →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 border-3 border-black dark:border-white bg-neutral-50 dark:bg-neutral-900 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff]"
                >
                  {item.imageUrl && (
                    <div className="w-full aspect-[1.91/1] border-2 border-black dark:border-neutral-700 bg-black overflow-hidden flex items-center justify-center">
                      <img src={item.imageUrl} alt="Post Visual" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <p className="font-sans text-xs leading-relaxed text-black dark:text-white whitespace-pre-line line-clamp-6">
                    {item.text}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t-2 border-black/10 dark:border-white/10 text-[11px] font-mono">
                    <span className="text-neutral-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(item.text);
                          toast.success('Post text copied to clipboard!');
                        }}
                        className="px-2 py-0.5 border border-black dark:border-white text-[10px] font-bold uppercase hover:bg-neutral-200 dark:hover:bg-neutral-800"
                        title="Copy post text"
                      >
                        COPY
                      </button>
                      <a
                        href={item.postUrl || 'https://www.linkedin.com/feed/'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-2 py-0.5 border border-black dark:border-white bg-[#0077B5] text-white text-[10px] font-bold uppercase hover:bg-[#006097]"
                      >
                        FEED <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PROVIDER VAULT MODAL                                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {isVaultOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsVaultOpen(false);
          }}
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div
            data-lenis-prevent="true"
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain p-6 border-4 border-black dark:border-white bg-white dark:bg-black shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_#ffffff] flex flex-col gap-5"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-4 border-black dark:border-white pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-400 border-2 border-black">
                  <Shield className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-mono font-black uppercase text-base text-black dark:text-white">
                    AI PROVIDER VAULT
                  </h3>
                  <p className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400 uppercase">
                    AES-256-GCM ENCRYPTED • YOUR KEYS NEVER STORED IN PLAINTEXT
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVaultOpen(false)}
                className="p-2 border-2 border-black dark:border-white hover:bg-neutral-100 dark:hover:bg-neutral-900"
              >
                <X className="w-5 h-5 text-black dark:text-white" />
              </button>
            </div>

            {/* Global Message */}
            {vaultMessage && (
              <div className="p-3 border-2 border-black bg-emerald-100 dark:bg-emerald-950/60 font-mono text-xs font-bold text-emerald-900 dark:text-emerald-200">
                {vaultMessage}
              </div>
            )}

            {/* Provider Cards */}
            <div className="flex flex-col gap-4">
              {ALL_PROVIDERS.map((provider) => {
                const info = PROVIDER_INFO[provider];
                const isConfigured = configuredProviders.includes(provider);
                const isDefault = defaultProvider === provider;
                const isSaving = vaultSaving === provider;
                const isDeleting = vaultDeleting === provider;

                return (
                  <div
                    key={provider}
                    className={`p-4 border-4 flex flex-col gap-3 transition-all ${
                      isDefault && isConfigured
                        ? 'border-black dark:border-white shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff]'
                        : 'border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {/* Provider Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 border-2 border-black flex items-center justify-center font-mono font-black text-white text-sm"
                          style={{ backgroundColor: info.color }}
                        >
                          {provider === 'gemini' ? '✦' : provider === 'openai' ? '◉' : '⚡'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm uppercase text-black dark:text-white">
                              {info.name}
                            </span>
                            {isDefault && isConfigured && (
                              <span className="px-1.5 py-0.5 bg-black dark:bg-white text-white dark:text-black font-mono text-[9px] font-black uppercase">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-[10px] text-neutral-500">{info.freeTier}</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {isConfigured ? (
                          <>
                            <span className="flex items-center gap-1 px-2 py-1 border-2 border-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 font-mono text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300">
                              <Check className="w-3 h-3" /> CONNECTED
                            </span>
                            {!isDefault && (
                              <button
                                onClick={() => handleSetDefault(provider)}
                                className="px-2 py-1 border-2 border-black dark:border-white bg-amber-400 hover:bg-amber-300 text-black font-mono text-[10px] font-black uppercase"
                                title="Set as default provider"
                              >
                                <Star className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="px-2 py-1 border-2 border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 font-mono text-[10px] font-bold uppercase text-neutral-500">
                            NOT SET
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Key Input + Actions */}
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={vaultKeyInputs[provider]}
                        onChange={(e) =>
                          setVaultKeyInputs((prev) => ({ ...prev, [provider]: e.target.value }))
                        }
                        placeholder={isConfigured ? '••••••••••••••••' : `Paste your ${info.keyPrefix} key here`}
                        className="flex-1 p-2.5 border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-900 font-mono text-xs text-black dark:text-white focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveProviderKey(provider)}
                        disabled={isSaving || !vaultKeyInputs[provider].trim()}
                        className="px-4 py-2.5 border-2 border-black bg-emerald-400 hover:bg-emerald-300 text-black font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#000000] disabled:opacity-40"
                      >
                        {isSaving ? '...' : isConfigured ? 'UPDATE' : 'SAVE'}
                      </button>
                      {isConfigured && (
                        <button
                          onClick={() => handleDeleteProviderKey(provider)}
                          disabled={isDeleting}
                          className="px-3 py-2.5 border-2 border-black bg-rose-100 hover:bg-rose-200 text-rose-800 font-mono font-black text-xs uppercase"
                          title="Delete this key"
                        >
                          {isDeleting ? '...' : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    {/* Get Key Link */}
                    <a
                      href={info.getKeyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      GET FREE API KEY → {info.getKeyUrl} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                );
              })}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsVaultOpen(false)}
              className="w-full py-3 border-4 border-black dark:border-white bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-black dark:text-white font-mono font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff]"
            >
              CLOSE VAULT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
