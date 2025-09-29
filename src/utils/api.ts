import axios from 'axios';
import { ImageModel, ImageGenerationParams, ApiError } from '@/types';

// Production configuration
const API_BASE_URL = 'https://image.pollinations.ai';
const TEXT_API_BASE_URL = 'https://text.pollinations.ai';

// Performance-optimized configuration
const AXIOS_CONFIG = {
  timeout: 15000, // Reduced to 15 seconds for faster failure detection
  headers: {
    'User-Agent': 'Pollinations-Image-Generator/1.0.0 (Enterprise)',
    'Accept': 'application/json',
  },
  // Optimized retry configuration for speed
  retry: 2, // Reduced retries for faster failure
  retryDelay: 500, // Faster retry delay
};

// Create axios instance with enterprise configuration
const apiClient = axios.create(AXIOS_CONFIG);

// Add response interceptor for enterprise error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      timestamp: new Date().toISOString(),
    });

    // Handle rate limiting
    if (error.response?.status === 429) {
      console.warn('Rate limited by Pollinations API, consider implementing backoff');
    }

    return Promise.reject(error);
  }
);

export const imageApi = {
  // Production-ready model fetching with proper error handling
  async getModels(): Promise<ImageModel[]> {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/models`);

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format from Pollinations API');
      }

      // Filter and validate models
      const validModels = response.data
        .filter((model: any) =>
          typeof model === 'string' &&
          model.trim() &&
          model.toLowerCase() !== 'nanobanana' // Enterprise filter
        )
        .map((model: string) => ({
          id: model,
          name: model.charAt(0).toUpperCase() + model.slice(1),
          description: getModelDescription(model)
        }));

      console.log(`Fetched ${validModels.length} models from Pollinations API`);
      return validModels;

    } catch (error) {
      console.error('Failed to fetch models from Pollinations API:', error);
      // Return enterprise fallback models
      return getFallbackModels();
    }
  },

  // Enhanced image generation with production features
  async generateImage(params: ImageGenerationParams): Promise<string> {
    try {
      const {
        prompt,
        model = 'flux',
        width = 1024,
        height = 1024,
        seed,
        enhance = false,
        nologo = true, // Enterprise default: no logos
        private: privateParam = false,
        safe = true, // Enterprise default: safe mode
        referrer,
      } = params;

      // Input validation for enterprise security
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        throw new Error('Prompt is required and must be a non-empty string');
      }

      if (prompt.length > 1000) {
        throw new Error('Prompt exceeds maximum length of 1000 characters');
      }

      // Validate dimensions (enterprise constraints)
      if (width < 256 || width > 2048 || height < 256 || height > 2048) {
        throw new Error('Image dimensions must be between 256x256 and 2048x2048');
      }

      // Encode and sanitize prompt
      const sanitizedPrompt = prompt.trim();
      const encodedPrompt = encodeURIComponent(sanitizedPrompt);

      // Build query parameters with enterprise defaults
      const queryParams = new URLSearchParams({
        model,
        width: width.toString(),
        height: height.toString(),
        enhance: enhance.toString(),
        nologo: nologo.toString(),
        private: privateParam.toString(),
        safe: safe.toString(),
      });

      // Optional parameters
      if (seed !== undefined && Number.isInteger(seed)) {
        queryParams.append('seed', seed.toString());
      }

      if (referrer && typeof referrer === 'string') {
        queryParams.append('referrer', referrer);
      }

      const url = `${API_BASE_URL}/prompt/${encodedPrompt}?${queryParams.toString()}`;

      console.log(`Generating image with model: ${model}, dimensions: ${width}x${height}`);

      // For Pollinations API, we return the URL directly as it serves images
      return url;

    } catch (error) {
      console.error('Image generation error:', error);
      throw error instanceof Error
        ? error
        : new Error('Failed to generate image due to unknown error');
    }
  },

  // Enhanced image URL generation with validation
  getImageUrl(params: ImageGenerationParams): string {
    try {
      const {
        prompt,
        model = 'flux',
        width = 1024,
        height = 1024,
        seed,
        enhance = false,
        nologo = true,
        private: privateParam = false,
        safe = true,
        referrer,
      } = params;

      if (!prompt || typeof prompt !== 'string') {
        throw new Error('Valid prompt is required');
      }

      const encodedPrompt = encodeURIComponent(prompt.trim());
      const queryParams = new URLSearchParams({
        model,
        width: width.toString(),
        height: height.toString(),
        enhance: enhance.toString(),
        nologo: nologo.toString(),
        private: privateParam.toString(),
        safe: safe.toString(),
      });

      if (seed !== undefined) {
        queryParams.append('seed', seed.toString());
      }

      if (referrer) {
        queryParams.append('referrer', referrer);
      }

      return `${API_BASE_URL}/prompt/${encodedPrompt}?${queryParams.toString()}`;

    } catch (error) {
      console.error('Error generating image URL:', error);
      throw error;
    }
  },
};

export const textApi = {
  // Production-ready prompt enhancement
  async enhancePrompt(prompt: string): Promise<string> {
    try {
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        throw new Error('Valid prompt is required for enhancement');
      }

      if (prompt.length > 500) {
        console.warn('Prompt is quite long, enhancement may be less effective');
      }

      const enhancementPrompt = `Enhance this image prompt to be more detailed and visually descriptive: "${prompt}". Return only the enhanced prompt without quotes.`;

      const response = await apiClient.get(
        `${TEXT_API_BASE_URL}/${encodeURIComponent(enhancementPrompt)}?model=openai&json=true`,
        { timeout: 15000 } // Shorter timeout for text API
      );

      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

      if (data && data.response && typeof data.response === 'string') {
        const enhanced = data.response.trim();
        console.log('Prompt enhanced successfully');
        return enhanced;
      }

      console.warn('Prompt enhancement returned invalid response, using original');
      return prompt;

    } catch (error) {
      console.warn('Failed to enhance prompt, using original:', error);
      return prompt; // Always return original prompt as fallback
    }
  },
};

// Enterprise utility functions
function getModelDescription(modelId: string): string {
  const descriptions: Record<string, string> = {
    flux: 'High-quality image generation with excellent detail and coherence',
    turbo: 'Fast image generation optimized for speed and efficiency',
    kontext: 'Context-aware model that understands complex prompts better',
  };
  return descriptions[modelId] || 'Advanced AI image generation model';
}

function getFallbackModels(): ImageModel[] {
  return [
    { id: 'flux', name: 'Flux', description: 'High-quality image generation with excellent detail and coherence' },
    { id: 'turbo', name: 'Turbo', description: 'Fast image generation optimized for speed and efficiency' },
    { id: 'kontext', name: 'Kontext', description: 'Context-aware model that understands complex prompts better' },
  ];
}
