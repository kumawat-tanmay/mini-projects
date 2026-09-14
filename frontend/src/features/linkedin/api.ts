import { apiFetch } from '@/utils/api';

export interface LinkedInProfile {
  name: string;
  email: string;
  picture: string;
  expiresAt: string;
  isExpired?: boolean;
}

export interface PostHistoryItem {
  _id?: string;
  text: string;
  imageUrl?: string;
  postUrn: string;
  postUrl: string;
  createdAt: string;
}

export type AIProvider = 'gemini' | 'openai' | 'groq';

export interface LinkedInStatusResponse {
  isConnected: boolean;
  profile: LinkedInProfile | null;
  configuredProviders: AIProvider[];
  defaultProvider: AIProvider;
  postHistory: PostHistoryItem[];
}

export interface GeneratePostPayload {
  topic: string;
  details?: string;
  tone?: string;
  targetAudience?: string;
  callToAction?: string;
  includeImage?: boolean;
  imageTheme?: string;
  visualStyle?: string;
  provider?: AIProvider;
}

export interface GeneratePostResponse {
  content: string;
  imageUrl?: string;
  imagePrompt?: string;
  visualDirection?: string;
  generatedBy: string;
  note?: string;
}

export interface PublishPostResponse {
  success: boolean;
  message: string;
  postUrn: string;
  postUrl: string;
}

// 1. Get OAuth Authorization URL
export const getLinkedInAuthUrl = async (redirectUri: string): Promise<{ authUrl: string; state: string }> => {
  return apiFetch(`/linkedin/auth-url?redirectUri=${encodeURIComponent(redirectUri)}`);
};

// 2. Exchange OAuth code for token
export const exchangeLinkedInCode = async (
  code: string,
  redirectUri: string
): Promise<{ success: boolean; profile: LinkedInProfile }> => {
  return apiFetch('/linkedin/callback', {
    method: 'POST',
    body: JSON.stringify({ code, redirectUri }),
  });
};

// 3. Get connection status and past posts
export const getLinkedInStatus = async (): Promise<LinkedInStatusResponse> => {
  return apiFetch('/linkedin/status');
};

// 4. Disconnect LinkedIn account
export const disconnectLinkedIn = async (): Promise<{ success: boolean; message: string }> => {
  return apiFetch('/linkedin/disconnect', {
    method: 'POST',
  });
};

// 5. Save encrypted AI API key for a specific provider
export const saveProviderApiKey = async (
  provider: AIProvider,
  apiKey: string
): Promise<{ success: boolean; message: string }> => {
  return apiFetch('/linkedin/api-key', {
    method: 'POST',
    body: JSON.stringify({ provider, apiKey }),
  });
};

// 5b. Delete AI API key for a specific provider
export const deleteProviderApiKey = async (
  provider: AIProvider
): Promise<{ success: boolean; message: string }> => {
  return apiFetch('/linkedin/api-key', {
    method: 'DELETE',
    body: JSON.stringify({ provider }),
  });
};

// 5c. Set default AI provider
export const setDefaultAIProvider = async (
  provider: AIProvider
): Promise<{ success: boolean; message: string }> => {
  return apiFetch('/linkedin/default-provider', {
    method: 'POST',
    body: JSON.stringify({ provider }),
  });
};

// 6. Generate AI post content
export const generateLinkedInPost = async (payload: GeneratePostPayload): Promise<GeneratePostResponse> => {
  return apiFetch('/linkedin/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// 7. Publish post to personal LinkedIn feed
export const publishToLinkedIn = async (text: string, imageUrl?: string): Promise<PublishPostResponse> => {
  return apiFetch('/linkedin/publish', {
    method: 'POST',
    body: JSON.stringify({ text, imageUrl }),
  });
};
