import axios from 'axios';
import { ImageModel, ImageGenerationParams, ApiError } from '@/types';

const API_BASE_URL = 'https://image.pollinations.ai';
const TEXT_API_BASE_URL = 'https://text.pollinations.ai';

const apiClient = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent': 'Pollinations-Image-Generator/1.0.0 (Enterprise)',
    Accept: 'application/json',
  },
});

/* -------------------------------------------------- */
/*  NEW:  fetch image as Blob  →  objectURL           */
/* -------------------------------------------------- */
export const imageApi = {
  async getModels(): Promise<ImageModel[]> {
    try {
      const { data } = await apiClient.get(`${API_BASE_URL}/models`);
      if (!Array.isArray(data)) throw new Error('Bad models response');
      return data
        .filter((m) => typeof m === 'string' && m.toLowerCase() !== 'nanobanana')
        .map((id) => ({
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          description: getModelDescription(id),
        }));
    } catch {
      return getFallbackModels();
    }
  },

  async generateImage(params: ImageGenerationParams): Promise<string> {
    const url = this.getImageUrl(params);
    /*  NEW:  fetch as blob to avoid CORS tainting  */
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('Image request failed');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  getImageUrl(params: ImageGenerationParams): string {
    const {
      prompt,
      model = 'turbo',
      width = 1024,
      height = 1024,
      seed,
      nologo = true,
      safe = true,
    } = params;

    const q = new URLSearchParams({
      model,
      width: String(width),
      height: String(height),
      nologo: String(nologo),
      safe: String(safe),
    });
    if (seed) q.append('seed', String(seed));
    return `${API_BASE_URL}/prompt/${encodeURIComponent(prompt.trim())}?${q}`;
  },
};

export const textApi = {
  async enhancePrompt(prompt: string): Promise<string> {
    try {
      const { data } = await apiClient.get(
        `${TEXT_API_BASE_URL}/${encodeURIComponent(
          `Enhance this prompt: "${prompt}"`
        )}?model=openai&json=true`,
        { timeout: 15000 }
      );
      const obj = typeof data === 'string' ? JSON.parse(data) : data;
      return obj?.response || prompt;
    } catch {
      return prompt;
    }
  },
};

/* -------------------------------------------------- */
/*  helpers                                           */
/* -------------------------------------------------- */
function getModelDescription(id: string): string {
  const map: Record<string, string> = {
    flux: 'High-quality image generation with excellent detail and coherence',
    turbo: 'Fast image generation optimized for speed and efficiency',
    kontext: 'Context-aware model that understands complex prompts better',
  };
  return map[id] || 'Advanced AI image generation model';
}

function getFallbackModels(): ImageModel[] {
  return ['flux', 'turbo', 'kontext'].map((id) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    description: getModelDescription(id),
  }));
}
