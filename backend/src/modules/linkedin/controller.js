const LinkedinConnection = require('./model');
const { encrypt, decrypt } = require('../../utils/crypto');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '77j6ag1mgnq6h4';
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';

const VALID_PROVIDERS = ['gemini', 'openai', 'groq'];

// 1. Generate LinkedIn OAuth Authorization URL
exports.getAuthUrl = async (req, res) => {
  try {
    const { redirectUri } = req.query;
    if (!redirectUri) {
      return res.status(400).json({ error: 'redirectUri is required.' });
    }

    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Request scopes: w_member_social (posting) + openid, profile, email (identification)
    const scope = encodeURIComponent('w_member_social openid profile email');
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${state}&scope=${scope}`;

    res.json({ authUrl, state });
  } catch (error) {
    console.error('LinkedIn auth URL error:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL.' });
  }
};

// 2. Exchange Authorization Code for Access Token and save connection
exports.handleCallback = async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code || !redirectUri) {
      return res.status(400).json({ error: 'Authorization code and redirectUri are required.' });
    }

    const secret = LINKEDIN_CLIENT_SECRET;
    if (!secret) {
      return res.status(500).json({
        error: 'LINKEDIN_CLIENT_SECRET is not configured in backend .env file.',
      });
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: secret,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('LinkedIn token exchange error:', tokenData);
      return res.status(400).json({
        error: tokenData.error_description || tokenData.error || 'Failed to exchange token with LinkedIn.',
      });
    }

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 5184000; // ~60 days
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Fetch user profile from LinkedIn OpenID userinfo endpoint
    let profileData = {};
    try {
      const userInfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (userInfoRes.ok) {
        profileData = await userInfoRes.json();
      }
    } catch (userInfoErr) {
      console.warn('Could not fetch userinfo via OpenID, attempting /v2/me:', userInfoErr);
    }

    // Fallback if openid sub wasn't returned
    let linkedinId = profileData.sub || '';
    if (!linkedinId) {
      try {
        const meRes = await fetch('https://api.linkedin.com/v2/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          linkedinId = meData.id || '';
        }
      } catch (meErr) {
        console.warn('Could not fetch /v2/me:', meErr);
      }
    }

    const name = profileData.name || `${profileData.given_name || ''} ${profileData.family_name || ''}`.trim() || 'LinkedIn User';
    const email = profileData.email || '';
    const picture = profileData.picture || '';

    // Upsert user's connection in MongoDB
    const connection = await LinkedinConnection.findOneAndUpdate(
      { userId: req.user.id },
      {
        accessToken,
        expiresAt,
        linkedinId,
        name,
        email,
        picture,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      profile: {
        name: connection.name,
        email: connection.email,
        picture: connection.picture,
        expiresAt: connection.expiresAt,
        isConnected: true,
      },
    });
  } catch (error) {
    console.error('LinkedIn callback processing error:', error);
    res.status(500).json({ error: 'Failed to complete LinkedIn authorization.' });
  }
};

// 3. Get Current Connection Status & Post History
exports.getStatus = async (req, res) => {
  try {
    const connection = await LinkedinConnection.findOne({ userId: req.user.id });

    if (!connection || !connection.accessToken) {
      // Determine which providers have keys configured
      const configuredProviders = [];
      if (connection?.aiKeys?.gemini) configuredProviders.push('gemini');
      if (connection?.aiKeys?.openai) configuredProviders.push('openai');
      if (connection?.aiKeys?.groq) configuredProviders.push('groq');

      return res.json({
        isConnected: false,
        profile: null,
        configuredProviders,
        defaultProvider: connection?.defaultProvider || 'gemini',
        postHistory: connection?.postHistory || [],
      });
    }

    const isExpired = connection.expiresAt && new Date() > connection.expiresAt;

    // Determine which providers have keys configured (never expose actual keys)
    const configuredProviders = [];
    if (connection.aiKeys?.gemini) configuredProviders.push('gemini');
    if (connection.aiKeys?.openai) configuredProviders.push('openai');
    if (connection.aiKeys?.groq) configuredProviders.push('groq');

    res.json({
      isConnected: !isExpired,
      profile: {
        name: connection.name,
        email: connection.email,
        picture: connection.picture,
        expiresAt: connection.expiresAt,
        isExpired,
      },
      configuredProviders,
      defaultProvider: connection.defaultProvider || 'gemini',
      postHistory: connection.postHistory || [],
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to retrieve LinkedIn status.' });
  }
};

// 4. Disconnect LinkedIn Account
exports.disconnect = async (req, res) => {
  try {
    await LinkedinConnection.findOneAndUpdate(
      { userId: req.user.id },
      {
        accessToken: '',
        linkedinId: '',
        name: '',
        picture: '',
        expiresAt: null,
      }
    );
    res.json({ success: true, message: 'LinkedIn account disconnected successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect LinkedIn account.' });
  }
};

// 5. Save Encrypted AI API Key for a specific provider
exports.saveApiKey = async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({
        error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}`,
      });
    }

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({ error: 'API key is required and must be a non-empty string.' });
    }

    // Encrypt the API key before storing
    const encryptedKey = encrypt(apiKey.trim());

    const updateField = `aiKeys.${provider}`;
    const update = { [updateField]: encryptedKey };

    // Also set as default provider if this is the first key being saved
    const connection = await LinkedinConnection.findOne({ userId: req.user.id });
    const hasAnyKey = connection?.aiKeys?.gemini || connection?.aiKeys?.openai || connection?.aiKeys?.groq;
    if (!hasAnyKey) {
      update.defaultProvider = provider;
    }

    await LinkedinConnection.findOneAndUpdate(
      { userId: req.user.id },
      update,
      { new: true, upsert: true }
    );

    res.json({ success: true, message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API key saved and encrypted successfully.` });
  } catch (error) {
    console.error('Save API key error:', error);
    res.status(500).json({ error: 'Failed to save API key.' });
  }
};

// 5b. Delete an AI API Key for a specific provider
exports.deleteApiKey = async (req, res) => {
  try {
    const { provider } = req.body;

    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({
        error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}`,
      });
    }

    const updateField = `aiKeys.${provider}`;
    const connection = await LinkedinConnection.findOneAndUpdate(
      { userId: req.user.id },
      { [updateField]: '' },
      { new: true }
    );

    // If the deleted provider was the default, switch to another configured provider
    if (connection && connection.defaultProvider === provider) {
      let newDefault = 'gemini';
      if (connection.aiKeys?.gemini) newDefault = 'gemini';
      else if (connection.aiKeys?.openai) newDefault = 'openai';
      else if (connection.aiKeys?.groq) newDefault = 'groq';

      connection.defaultProvider = newDefault;
      await connection.save();
    }

    res.json({ success: true, message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API key deleted successfully.` });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key.' });
  }
};

// 5c. Set default AI provider
exports.setDefaultProvider = async (req, res) => {
  try {
    const { provider } = req.body;

    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({
        error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}`,
      });
    }

    await LinkedinConnection.findOneAndUpdate(
      { userId: req.user.id },
      { defaultProvider: provider },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: `Default provider set to ${provider}.` });
  } catch (error) {
    console.error('Set default provider error:', error);
    res.status(500).json({ error: 'Failed to set default provider.' });
  }
};

// ─── AI Image Generation Engine (Zero Pollinations / Authenticated & Clean) ───
async function generateAIImage({ topic, details, customPrompt, visualStyle, openaiApiKey, geminiApiKey }) {
  let visualPrompt = customPrompt;
  if (!visualPrompt || visualPrompt.trim().length === 0) {
    const cleanTopic = (topic || '').slice(0, 100).replace(/[^a-zA-Z0-9\s,.'&-]/g, '');
    const cleanDetails = details ? `, ${(details || '').slice(0, 60).replace(/[^a-zA-Z0-9\s,.'&-]/g, '')}` : '';
    const styleCue = visualStyle && visualStyle.trim() ? `${visualStyle.trim()} style.` : 'striking modern brutalist composition, dramatic volumetric lighting.';
    visualPrompt = `Striking visual representation of ${cleanTopic}${cleanDetails}. ${styleCue} Masterpiece, high resolution, sharp focus. Absolutely NO text, NO letters, NO words, NO numbers, NO watermarks, NO logos anywhere in the image.`;
  }

  // Tier 1: If OpenAI key is available, generate with DALL-E 3 (100% native ChatGPT quality, zero watermarks)
  if (openaiApiKey) {
    try {
      const openAiImageRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        signal: AbortSignal.timeout(18000),
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: visualPrompt,
          n: 1,
          size: '1792x1024',
          quality: 'standard',
        }),
      });

      if (openAiImageRes.ok) {
        const data = await openAiImageRes.json();
        const imageUrl = data.data?.[0]?.url;
        if (imageUrl) {
          return { imageUrl, visualPrompt };
        }
      } else {
        const errText = await openAiImageRes.text();
        console.warn('OpenAI DALL-E failed:', errText);
      }
    } catch (err) {
      console.warn('OpenAI DALL-E error:', err.message);
    }
  }

  // Tier 2: If Gemini key is available and has image quota (paid tier), generate with Google Image model
  if (geminiApiKey) {
    try {
      const geminiImgRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: visualPrompt }] }],
            generationConfig: { responseModalities: ['IMAGE'] },
          }),
        }
      );
      if (geminiImgRes.ok) {
        const geminiImgData = await geminiImgRes.json();
        const part = geminiImgData.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return { imageUrl: `data:${mime};base64,${part.inlineData.data}`, visualPrompt };
        }
      }
    } catch (_) {
      // Free tier has quota limit 0; catch gracefully
    }
  }

  // Tier 3: Zero-Dependency Clean SVG Brutalist Poster Card (Zero watermarks, instant, 100% reliable)
  const cleanTitle = (topic || 'LinkedIn Insight').slice(0, 70).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cleanSubtitle = (visualStyle || 'Brutalist Tech Editorial').toUpperCase().slice(0, 40).replace(/&/g, '&amp;');
  const svgCard = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0A0A0A" />
  <rect x="30" y="30" width="1140" height="570" fill="#121212" stroke="#FFFFFF" stroke-width="4" />
  <line x1="30" y1="110" x2="1170" y2="110" stroke="#FFFFFF" stroke-width="2" />
  <text x="60" y="80" fill="#F59E0B" font-family="monospace" font-size="22" font-weight="900" letter-spacing="3">EDITORIAL // ${cleanSubtitle}</text>
  <rect x="1070" y="55" width="70" height="32" fill="#F59E0B" />
  <text x="1085" y="77" fill="#000000" font-family="monospace" font-size="14" font-weight="900">STUDIO</text>
  <text x="60" y="240" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="46" font-weight="900">
    ${cleanTitle}
  </text>
  <rect x="60" y="300" width="280" height="8" fill="#F59E0B" />
  <rect x="60" y="470" width="1080" height="80" fill="#1A1A1A" stroke="#333333" stroke-width="2" />
  <text x="90" y="520" fill="#A3A3A3" font-family="monospace" font-size="18" font-weight="bold" letter-spacing="1">LINKEDIN EXECUTIVE EDITION • HIGH-IMPACT ARCHITECTURE</text>
</svg>`;
  const svgBase64 = Buffer.from(svgCard).toString('base64');
  const fallbackUrl = `data:image/svg+xml;base64,${svgBase64}`;

  // Automatically rasterize SVG to PNG on Cloudinary if credentials are present
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    try {
      const cldUpload = await cloudinary.uploader.upload(fallbackUrl, {
        folder: process.env.CLOUDINARY_FOLDER_NAME || 'MINI_PROJECTS',
        format: 'png',
        resource_type: 'image',
      });
      if (cldUpload?.secure_url) {
        return { imageUrl: cldUpload.secure_url, visualPrompt };
      }
    } catch (cldErr) {
      console.warn('Cloudinary rasterization fallback notice:', cldErr.message);
    }
  }

  return { imageUrl: fallbackUrl, visualPrompt };
}

// 6. AI Post Generator — Multi-Provider with Encrypted Key Retrieval & Visuals
exports.generatePost = async (req, res) => {
  try {
    const {
      prompt: userPrompt,
      topic: userTopic,
      details = '',
      tone = 'Thought Leadership',
      targetAudience = 'Tech & Professionals',
      callToAction = 'Comment Below',
      includeImage = false,
      imageTheme = '',
      visualStyle = '',
      provider: requestedProvider,
    } = req.body;

    const topic = userPrompt || userTopic;

    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt or idea description is required.' });
    }

    const connection = await LinkedinConnection.findOne({ userId: req.user.id });

    // Determine which provider to use: explicit request > user's default > first available
    const providerToUse = requestedProvider || connection?.defaultProvider || 'gemini';
    const encryptedKey = connection?.aiKeys?.[providerToUse] || '';

    const effectiveStyle = (visualStyle || imageTheme || '').trim();

    if (encryptedKey) {
      let apiKey;
      try {
        apiKey = decrypt(encryptedKey);
      } catch (decryptErr) {
        console.error('Failed to decrypt API key for provider:', providerToUse, decryptErr);
        return res.status(500).json({
          error: `Failed to decrypt your ${providerToUse} API key. Please re-save your key in the Provider Vault.`,
        });
      }

      // Build the LinkedIn agent prompt instructing AI to generate both post and visual art direction
      const detailsPart = details && details.trim() ? `\n- Specific Details & Key Points to Include:\n"${details.trim()}"` : '';
      const stylePart = effectiveStyle
        ? `\n- Requested Visual Vibe / Art Style: "${effectiveStyle}"`
        : '\n- Visual Vibe: Select the most creative, high-impact artistic visual direction (can be ANY style: photorealistic, 3D render, documentary film still, dark surrealism, vector art, etc.) that best represents the post topic.';

      const prompt = `You are an elite LinkedIn Content Creator and Creative Visual Art Director.
Generate two synchronized assets based on the user's request:
1. An authentic, viral LinkedIn post designed for maximum engagement.
2. A creative, high-impact Visual Art Direction and companion image generation prompt.

User Request:
- Topic / Idea: "${topic}"${detailsPart}
- Tone of Voice: "${tone}"
- Target Audience: "${targetAudience}"
- Desired Call-To-Action: "${callToAction}"${stylePart}

Formatting Rules for LinkedIn Post:
- Start with a scroll-stopping one-line hook.
- Short, punchy sentences and single-sentence paragraphs. Avoid walls of text.
- High-value bullet points or actionable insights.
- Authentic perspective with a closing question matching the CTA.
- 3-5 relevant, trending hashtags.

Visual Art Direction Rules:
- Craft an evocative, artistic visual scene or visual metaphor.
- Masterpiece quality, cinematic lighting, dramatic perspective.
- ABSOLUTELY NO text, NO typography, NO letters, NO words, NO numbers, NO watermarks, NO logos in the visual.

Output Format:
You MUST output your response in valid JSON with exactly these three keys:
{
  "postText": "the full linkedin post here...",
  "visualDirection": "Short 2-4 word name of the visual style (e.g. 'Cinematic 35mm Photography', '3D Isometric Glass', 'Dark Surrealism')",
  "imagePrompt": "A vivid 35-65 word scene description specifying camera angle, lighting, textures, and mood. No text or words."
}
IMPORTANT: Return ONLY the raw JSON object, no markdown code fences.`;

      let generatedContent = null;
      let visualDirection = null;
      let aiImagePrompt = null;
      let fallbackReason = null;

      // ─── GEMINI ───
      if (providerToUse === 'gemini') {
        let candidateModels = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-2.0-flash'];

        try {
          const listRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            { signal: AbortSignal.timeout(3000) }
          );
          if (listRes.ok) {
            const listData = await listRes.json();
            const models = listData.models || [];
            const supported = models
              .filter((m) => {
                const name = (m.name || '').toLowerCase();
                const methods = m.supportedGenerationMethods || [];
                return methods.includes('generateContent') && !/tts|audio|embed|realtime|imagen|vision-only/i.test(name);
              })
              .map((m) => m.name.replace('models/', ''));

            if (supported.length > 0) {
              const flashModels = supported.filter((name) => name.toLowerCase().includes('flash'));
              const v3Flash = flashModels.filter((name) => /3\.[0-9]/.test(name));
              const otherFlash = flashModels.filter((name) => !/3\.[0-9]/.test(name));
              candidateModels = [...new Set([...v3Flash, ...candidateModels, ...otherFlash, ...supported])];
            }
          }
        } catch (listErr) {
          console.warn('Querying Gemini model list timed out, using fallback defaults:', listErr.message);
        }

        const activeCandidates = candidateModels.slice(0, 2);
        let lastErrText = '';

        for (const modelName of activeCandidates) {
          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(6000),
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: {
                    temperature: 0.75,
                    maxOutputTokens: 1400,
                    responseMimeType: 'application/json',
                  },
                }),
              }
            );

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (rawText) {
                try {
                  const cleaned = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
                  const parsed = JSON.parse(cleaned);
                  generatedContent = parsed.postText || rawText;
                  visualDirection = parsed.visualDirection;
                  aiImagePrompt = parsed.imagePrompt;
                } catch (_) {
                  generatedContent = rawText;
                }
                break;
              }
            } else {
              lastErrText = await geminiRes.text();
              console.warn(`Gemini model ${modelName} returned error:`, lastErrText);
            }
          } catch (callErr) {
            console.warn(`Gemini model ${modelName} call failed:`, callErr.message);
          }
        }

        if (!generatedContent) {
          console.warn('Gemini generation unsuccessful. Falling back smoothly to template engine.');
          try {
            const parsed = JSON.parse(lastErrText);
            fallbackReason = parsed.error?.message || 'Gemini API was unavailable. Generated via structured engine.';
          } catch (_) {
            fallbackReason = 'Gemini API was unavailable. Generated via structured engine.';
          }
        }
      }

      // ─── OPENAI ───
      else if (providerToUse === 'openai') {
        try {
          const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            signal: AbortSignal.timeout(7000),
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: 'You are an elite LinkedIn content creator and creative visual art director. Output strictly in JSON format.' },
                { role: 'user', content: prompt },
              ],
              temperature: 0.75,
              max_tokens: 1400,
            }),
          });

          if (openaiRes.ok) {
            const openaiData = await openaiRes.json();
            const raw = openaiData.choices?.[0]?.message?.content;
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                generatedContent = parsed.postText || raw;
                visualDirection = parsed.visualDirection;
                aiImagePrompt = parsed.imagePrompt;
              } catch (_) {
                generatedContent = raw;
              }
            }
          } else {
            const errText = await openaiRes.text();
            console.warn('OpenAI API error:', errText);
            fallbackReason = 'OpenAI API error. Generated via structured engine.';
          }
        } catch (openaiErr) {
          console.warn('OpenAI call failed:', openaiErr.message);
          fallbackReason = 'OpenAI request timed out. Generated via structured engine.';
        }
      }

      // ─── GROQ ───
      else if (providerToUse === 'groq') {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            signal: AbortSignal.timeout(6000),
            body: JSON.stringify({
              model: 'llama-3.1-8b-instant',
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: 'You are an elite LinkedIn content creator and creative visual art director. Output strictly in JSON format.' },
                { role: 'user', content: prompt },
              ],
              temperature: 0.75,
              max_tokens: 1400,
            }),
          });

          if (groqRes.ok) {
            const groqData = await groqRes.json();
            const raw = groqData.choices?.[0]?.message?.content;
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                generatedContent = parsed.postText || raw;
                visualDirection = parsed.visualDirection;
                aiImagePrompt = parsed.imagePrompt;
              } catch (_) {
                generatedContent = raw;
              }
            }
          } else {
            const errText = await groqRes.text();
            console.warn('Groq API error:', errText);
            fallbackReason = 'Groq API error. Generated via structured engine.';
          }
        } catch (groqErr) {
          console.warn('Groq call failed:', groqErr.message);
          fallbackReason = 'Groq request timed out. Generated via structured engine.';
        }
      }

      if (generatedContent) {
        let imageUrl = null;
        let imagePrompt = null;

        if (includeImage) {
          let openAiKeyForImage = null;
          let geminiKeyForImage = null;

          if (providerToUse === 'openai') {
            openAiKeyForImage = apiKey;
          } else if (connection?.aiKeys?.openai) {
            try { openAiKeyForImage = decrypt(connection.aiKeys.openai); } catch (_) {}
          }

          if (providerToUse === 'gemini') {
            geminiKeyForImage = apiKey;
          } else if (connection?.aiKeys?.gemini) {
            try { geminiKeyForImage = decrypt(connection.aiKeys.gemini); } catch (_) {}
          }

          const imgRes = await generateAIImage({
            topic,
            details,
            customPrompt: aiImagePrompt,
            visualStyle: visualDirection || effectiveStyle,
            openaiApiKey: openAiKeyForImage,
            geminiApiKey: geminiKeyForImage,
          });
          imageUrl = imgRes.imageUrl;
          imagePrompt = imgRes.visualPrompt;
        }

        return res.json({
          content: generatedContent.trim(),
          imageUrl,
          imagePrompt,
          visualDirection: visualDirection || effectiveStyle || 'AI Art Direction',
          generatedBy: providerToUse,
        });
      }
    }

    // ─── FALLBACK: High-Converting Structured Template Engine ───
    const templatesByTone = {
      'Thought Leadership': [
        `Most people get this completely backward:\n\n"${topic}" is not about working harder.\nIt's about having the right system.\n\nHere are 3 truths I've learned the hard way:\n\n1. Focus on outcomes, not hours.\n2. Standardize before you automate.\n3. Consistency beats intensity every single time.\n\nWhen you master this, everything starts compounding.\n\nWhat is one lesson that changed how you approach your craft?\n\n#Leadership #Productivity #GrowthMindset #CareerDevelopment`,
      ],
      'Storytelling': [
        `3 years ago, I had no idea how to handle "${topic}".\n\nI was overwhelmed. I tried following the standard playbook, but nothing worked.\n\nUntil one conversation changed my entire perspective:\n\n"Stop trying to fix everything at once. Focus on the single highest-leverage lever."\n\nHere is what happened once I shifted my focus:\n• Clarity replaced stress\n• Results accelerated by 10x\n• Momentum became effortless\n\nThe lesson? Most problems aren't complex. Our approaches to them are.\n\nHave you ever had an insight that shifted your entire career trajectory?\n\n#Stories #PersonalGrowth #LessonsLearned #TechCareers`,
      ],
      'Educational': [
        `A 2-minute breakdown of "${topic}" you can implement today:\n\n📌 The Core Problem:\nMost teams spend 80% of their energy on things that move the needle 20%.\n\n📌 The Framework:\nStep 1: Audit where your time actually goes.\nStep 2: Eliminate friction points ruthlessly.\nStep 3: Build repeatable checklists.\n\n📌 Key Takeaway:\nSimplicity scales. Complexity breaks.\n\nBookmark this for later. What would you add to this framework?\n\n#Learning #Frameworks #BestPractices #Engineering`,
      ],
      'Contrarian': [
        `Unpopular opinion:\n\nEverything people tell you about "${topic}" is outdated.\n\nHere is what nobody wants to admit:\n\n• Following the herd guarantees average results.\n• Playing it safe is often the riskiest decision you can make.\n• The biggest breakthroughs come from questioning established dogmas.\n\nDo you agree, or am I completely missing the mark?\n\n#HotTake #Innovation #Strategy #Disruption`,
      ],
    };

    const defaultList = templatesByTone[tone] || templatesByTone['Thought Leadership'];
    const chosenTemplate = defaultList[Math.floor(Math.random() * defaultList.length)];

    let fallbackImageUrl = null;
    let fallbackImagePrompt = null;
    if (includeImage) {
      const imgRes = await generateAIImage({ topic, details, visualStyle: effectiveStyle });
      fallbackImageUrl = imgRes.imageUrl;
      fallbackImagePrompt = imgRes.visualPrompt;
    }

    res.json({
      content: chosenTemplate,
      imageUrl: fallbackImageUrl,
      imagePrompt: fallbackImagePrompt,
      generatedBy: 'template-engine',
      note: fallbackReason || (providerToUse ? `${providerToUse} service unavailable. Generated via structured engine.` : 'No AI provider key configured. Add your free API key in the Provider Vault (⚙️ AI KEY button) for custom AI generation.'),
    });
  } catch (error) {
    console.error('Post generation error:', error);
    res.status(500).json({ error: 'Failed to generate post.' });
  }
};

// 7. Helper: Upload Image Binary to LinkedIn Media Servers (v2 Assets & REST Fallback)
async function uploadImageToLinkedIn(accessToken, authorUrn, rawImageUrl) {
  if (!rawImageUrl || typeof rawImageUrl !== 'string' || rawImageUrl.trim().length === 0) {
    return null;
  }

  let imageUrl = rawImageUrl.trim();
  let buffer = null;
  let mimeType = 'image/png';

  // Step 1: Ensure raster PNG/JPEG (LinkedIn strictly rejects SVG)
  // If SVG or temporary DALL-E URL, convert through Cloudinary
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    (imageUrl.startsWith('data:image/svg') || imageUrl.includes('oaidalleapiprodscus.blob.core.windows.net') || imageUrl.startsWith('data:'))
  ) {
    try {
      console.log('[LinkedIn Media] Uploading image to Cloudinary for clean rasterization & permanent CDN hosting...');
      const cldRes = await cloudinary.uploader.upload(imageUrl, {
        folder: process.env.CLOUDINARY_FOLDER_NAME || 'MINI_PROJECTS',
        format: 'png',
        resource_type: 'image',
      });
      if (cldRes?.secure_url) {
        imageUrl = cldRes.secure_url;
        console.log('[LinkedIn Media] Cloudinary permanent URL ready:', imageUrl);
      }
    } catch (cldErr) {
      console.warn('[LinkedIn Media] Cloudinary upload notice:', cldErr.message);
    }
  }

  // Step 2: Download or decode the image buffer
  try {
    if (imageUrl.startsWith('data:')) {
      const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        buffer = Buffer.from(match[2], 'base64');
      }
    } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(18000) });
      if (imgRes.ok) {
        const ct = imgRes.headers.get('content-type');
        if (ct) mimeType = ct.split(';')[0].trim();
        const arrayBuf = await imgRes.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
      } else {
        throw new Error(`Failed to fetch image from URL (HTTP ${imgRes.status})`);
      }
    }

    if (!buffer || buffer.length === 0) {
      throw new Error('Image buffer is empty.');
    }

    console.log(`[LinkedIn Media] Image buffer ready: size=${buffer.length} bytes, mimeType=${mimeType}, owner=${authorUrn}`);

    // ─────────────────────────────────────────────────────────────
    // STRATEGY 1: Official LinkedIn v2 Assets API (Native to w_member_social)
    // ─────────────────────────────────────────────────────────────
    try {
      console.log('[LinkedIn Media] Attempting Strategy 1: /v2/assets?action=registerUpload...');
      const registerPayload = {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: authorUrn,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      };

      const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(registerPayload),
      });

      if (registerRes.ok) {
        const regData = await registerRes.json();
        const uploadMechanism = regData.value?.uploadMechanism?.[
          'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
        ];
        const uploadUrl = uploadMechanism?.uploadUrl;
        const extraHeaders = uploadMechanism?.headers || {};
        const assetUrn = regData.value?.asset;

        console.log('[LinkedIn Media] v2 registerUpload succeeded! Asset URN:', assetUrn);

        if (uploadUrl && assetUrn) {
          const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/octet-stream',
              ...extraHeaders,
            },
            body: buffer,
          });

          console.log('[LinkedIn Media] Binary upload status:', putRes.status);
          if (putRes.ok || putRes.status === 201 || putRes.status === 200) {
            return {
              type: 'asset',
              id: assetUrn,
              finalImageUrl: imageUrl,
            };
          } else {
            const putErr = await putRes.text().catch(() => '');
            console.warn('[LinkedIn Media] Binary upload to uploadUrl failed:', putRes.status, putErr);
          }
        }
      } else {
        const regErr = await registerRes.text().catch(() => '');
        console.warn('[LinkedIn Media] v2/assets registerUpload failed:', registerRes.status, regErr);
      }
    } catch (s1Err) {
      console.warn('[LinkedIn Media] Strategy 1 exception:', s1Err.message);
    }

    // ─────────────────────────────────────────────────────────────
    // STRATEGY 2: LinkedIn REST Images API (/rest/images)
    // ─────────────────────────────────────────────────────────────
    try {
      console.log('[LinkedIn Media] Attempting Strategy 2: /rest/images?action=initializeUpload...');
      const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202410',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          initializeUploadRequest: {
            owner: authorUrn,
          },
        }),
      });

      if (initRes.ok) {
        const initData = await initRes.json();
        const uploadUrl = initData.value?.uploadUrl;
        const imageUrn = initData.value?.image;

        console.log('[LinkedIn Media] REST initializeUpload succeeded! Image URN:', imageUrn);

        if (uploadUrl && imageUrn) {
          const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': mimeType || 'image/png',
            },
            body: buffer,
          });

          console.log('[LinkedIn Media] REST Binary upload status:', putRes.status);
          if (putRes.ok || putRes.status === 201 || putRes.status === 200) {
            return {
              type: 'image',
              id: imageUrn,
              finalImageUrl: imageUrl,
            };
          }
        }
      } else {
        const initErr = await initRes.text().catch(() => '');
        console.warn('[LinkedIn Media] REST images initializeUpload failed:', initRes.status, initErr);
      }
    } catch (s2Err) {
      console.warn('[LinkedIn Media] Strategy 2 exception:', s2Err.message);
    }
  } catch (err) {
    console.error('[LinkedIn Media] Fatal pipeline error:', err.message);
    throw err;
  }

  return null;
}

// 8. Publish Post to LinkedIn Profile (Text + High-Fidelity Visual Attachment)
exports.publishPost = async (req, res) => {
  try {
    const { text, imageUrl } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Post content cannot be empty.' });
    }

    const connection = await LinkedinConnection.findOne({ userId: req.user.id });

    if (!connection || !connection.accessToken) {
      return res.status(401).json({
        error: 'LinkedIn account is not connected. Please connect your LinkedIn account first.',
      });
    }

    if (connection.expiresAt && new Date() > connection.expiresAt) {
      return res.status(401).json({
        error: 'LinkedIn access token has expired. Please reconnect your account.',
      });
    }

    const accessToken = connection.accessToken;

    // Dynamically ensure author ID exists
    let linkedinId = connection.linkedinId;
    if (!linkedinId) {
      try {
        const uRes = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (uRes.ok) {
          const uData = await uRes.json();
          linkedinId = uData.sub || '';
          if (linkedinId) {
            connection.linkedinId = linkedinId;
            await connection.save();
          }
        }
      } catch (_) {}
    }

    if (!linkedinId) {
      return res.status(400).json({
        error: 'Could not resolve your LinkedIn Member ID. Please reconnect your account.',
      });
    }

    const authorUrn = linkedinId.startsWith('urn:li:')
      ? linkedinId
      : `urn:li:person:${linkedinId}`;

    console.log(`[LinkedIn Publish] Publishing post for ${authorUrn}, hasImage: ${!!imageUrl}`);

    let mediaResult = null;
    let imageUploadError = '';

    if (imageUrl) {
      try {
        mediaResult = await uploadImageToLinkedIn(accessToken, authorUrn, imageUrl);
        if (!mediaResult) {
          imageUploadError = 'LinkedIn rejected the image binary or upload mechanism.';
        }
      } catch (uploadErr) {
        console.error('[LinkedIn Publish] Image upload pipeline exception:', uploadErr);
        imageUploadError = uploadErr.message;
      }

      // If user requested image publishing but media upload failed, DO NOT silently post text!
      if (!mediaResult) {
        return res.status(422).json({
          error: `Failed to upload image to LinkedIn (${imageUploadError || 'server rejected'}). The post was NOT published to prevent posting without its image.`,
        });
      }
    }

    let postUrn = '';
    let postUrl = 'https://www.linkedin.com/feed/';

    if (mediaResult?.type === 'asset') {
      // Published via v2/ugcPosts with IMAGE
      const ugcPayload = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text.trim(),
            },
            shareMediaCategory: 'IMAGE',
            media: [
              {
                status: 'READY',
                description: {
                  text: 'Post Visual',
                },
                media: mediaResult.id,
                title: {
                  text: 'Post Visual',
                },
              },
            ],
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      console.log('[LinkedIn Publish] Publishing with v2/ugcPosts (IMAGE)...');
      const ugcRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(ugcPayload),
      });

      if (!ugcRes.ok) {
        const ugcErr = await ugcRes.json().catch(() => ({}));
        console.error('[LinkedIn Publish] ugcPosts IMAGE failed:', ugcErr);
        return res.status(ugcRes.status || 400).json({
          error: ugcErr.message || ugcErr.error || 'Failed to publish post with image to LinkedIn feed.',
        });
      }

      const ugcData = await ugcRes.json();
      postUrn = ugcData.id || '';
    } else if (mediaResult?.type === 'image') {
      // Published via rest/posts with media id
      const restPayload = {
        author: authorUrn,
        commentary: text.trim(),
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
        content: {
          media: {
            id: mediaResult.id,
            title: 'Post Visual',
          },
        },
      };

      console.log('[LinkedIn Publish] Publishing with /rest/posts (IMAGE)...');
      const restPostRes = await fetch('https://api.linkedin.com/rest/posts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202410',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(restPayload),
      });

      if (!restPostRes.ok && restPostRes.status !== 201) {
        const restErr = await restPostRes.text();
        console.error('[LinkedIn Publish] /rest/posts failed:', restErr);
        return res.status(restPostRes.status || 400).json({
          error: 'Failed to publish post to LinkedIn feed.',
        });
      }

      postUrn = restPostRes.headers.get('x-restli-id') || restPostRes.headers.get('x-linkedin-id') || '';
    } else {
      // Text-only post via v2/ugcPosts
      const ugcPayload = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text.trim(),
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const ugcRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(ugcPayload),
      });

      if (!ugcRes.ok) {
        const ugcErr = await ugcRes.json().catch(() => ({}));
        return res.status(ugcRes.status || 400).json({
          error: ugcErr.message || 'Failed to publish text post to LinkedIn feed.',
        });
      }

      const ugcData = await ugcRes.json();
      postUrn = ugcData.id || '';
    }

    // Save post into history with permanent image URL
    const savedImageUrl = mediaResult?.finalImageUrl || imageUrl || '';
    connection.postHistory.unshift({
      text: text.trim(),
      imageUrl: savedImageUrl,
      postUrn,
      postUrl,
      createdAt: new Date(),
    });

    if (connection.postHistory.length > 50) {
      connection.postHistory.pop();
    }

    await connection.save();

    res.json({
      success: true,
      message: mediaResult
        ? 'Post and visual banner successfully published to your LinkedIn profile!'
        : 'Post successfully published to your LinkedIn profile!',
      postUrn,
      postUrl,
      hasImage: !!mediaResult,
    });
  } catch (error) {
    console.error('Publish post error:', error);
    res.status(500).json({ error: error.message || 'Internal server error while publishing to LinkedIn.' });
  }
};
