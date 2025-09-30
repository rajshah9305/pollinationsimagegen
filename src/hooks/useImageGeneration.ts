import { useState, useCallback } from 'react';
import { ImageGenerationParams, GeneratedImage, ApiError } from '@/types';
import { imageApi } from '@/utils/api';
import { imageCache } from '@/utils/imageCache';

interface UseImageGenerationReturn {
  generateImage: (params: ImageGenerationParams) => Promise<GeneratedImage | null>;
  loading: boolean;
  error: ApiError | null;
  generatedImage: GeneratedImage | null;
  clearError: () => void;
  clearImage: () => void;
}

export function useImageGeneration(): UseImageGenerationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);

  const generateImage = useCallback(
    async (params: ImageGenerationParams): Promise<GeneratedImage | null> => {
      try {
        setLoading(true);
        setError(null);

        /*  cache lookup  */
        const cached = imageCache.get(params.prompt, params);
        if (cached) {
          const out: GeneratedImage = {
            url: cached.url,
            prompt: cached.prompt,
            model: cached.model,
            params,
            timestamp: new Date(cached.timestamp),
          };
          setGeneratedImage(out);
          return out;
        }

        /*  NEW:  fetch blob-URL  */
        const url = await imageApi.generateImage(params);

        const result: GeneratedImage = {
          url,
          prompt: params.prompt,
          model: params.model,
          params,
          timestamp: new Date(),
        };

        imageCache.set(params.prompt, params, url);
        setGeneratedImage(result);
        return result;
      } catch (err: any) {
        setError({ message: err.message || 'Generation failed' });
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = () => setError(null);
  const clearImage  = () => setGeneratedImage(null);

  return {
    generateImage,
    loading,
    error,
    generatedImage,
    clearError,
    clearImage,
  };
}
