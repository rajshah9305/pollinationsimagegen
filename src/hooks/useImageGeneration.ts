import { useState, useCallback } from 'react';
import { ImageGenerationParams, GeneratedImage, ApiError } from '@/types';
import { imageApi, textApi } from '@/utils/api';
import { imageCache } from '@/utils/imageCache';

interface UseImageGenerationReturn {
  generateImage: (params: ImageGenerationParams) => Promise<GeneratedImage | null>;
  loading: boolean;
  error: ApiError | null;
  generatedImage: GeneratedImage | null;
  clearError: () => void;
  clearImage: () => void;
  clearCache: () => void;
  getCacheStats: () => { size: number; maxSize: number };
}

// Production-ready image generation hook with enterprise features
export function useImageGeneration(): UseImageGenerationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);

  const generateImage = useCallback(async (params: ImageGenerationParams): Promise<GeneratedImage | null> => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[${new Date().toISOString()}] Starting image generation`, {
        model: params.model,
        promptLength: params.prompt?.length || 0,
        width: params.width,
        height: params.height,
      });

      // Check cache first for performance
      const cachedImage = imageCache.get(params.prompt, params);
      if (cachedImage) {
        console.log(`[${new Date().toISOString()}] Using cached image`);
        const cachedGeneratedImage = {
          url: cachedImage.url,
          prompt: cachedImage.prompt,
          model: cachedImage.model,
          params: cachedImage.params,
          timestamp: new Date(cachedImage.timestamp),
        };
        setGeneratedImage(cachedGeneratedImage);
        setLoading(false);
        return cachedGeneratedImage;
      }

      // Enhanced prompt if requested (enterprise feature)
      let finalPrompt = params.prompt;
      if (params.enhance) {
        console.log('Enhancing prompt...');
        finalPrompt = await textApi.enhancePrompt(params.prompt);
        console.log('Prompt enhanced successfully');
      }

      const enhancedParams = { ...params, prompt: finalPrompt };
      const imageUrl = imageApi.getImageUrl(enhancedParams);

      // Preload image for better UX
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log(`[${new Date().toISOString()}] Image URL is accessible`);
        }
      } catch (preloadError) {
        console.warn('Image preload check failed:', preloadError);
      }

      const newGeneratedImage: GeneratedImage = {
        url: imageUrl,
        prompt: finalPrompt,
        model: params.model,
        params: enhancedParams,
        timestamp: new Date(),
      };

      // Cache the image for future use
      imageCache.set(finalPrompt, enhancedParams, imageUrl);

      console.log(`[${new Date().toISOString()}] Setting generated image:`, {
        url: imageUrl,
        prompt: finalPrompt.substring(0, 50) + '...',
        model: params.model,
      });

      setGeneratedImage(newGeneratedImage);

      console.log(`[${new Date().toISOString()}] Image generation completed successfully`);

      return newGeneratedImage;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';

      console.error(`[${new Date().toISOString()}] Image generation failed:`, {
        error: errorMessage,
        params: { ...params, prompt: params.prompt?.substring(0, 50) + '...' },
      });

      setError({
        message: errorMessage,
        code: err instanceof Error && 'code' in err ? (err as any).code : undefined,
        status: err instanceof Error && 'status' in err ? (err as any).status : undefined,
      });

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearImage = useCallback(() => {
    setGeneratedImage(null);
  }, []);

  const clearCache = useCallback(() => {
    imageCache.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    return imageCache.getStats();
  }, []);

  return {
    generateImage,
    loading,
    error,
    generatedImage,
    clearError,
    clearImage,
    clearCache,
    getCacheStats,
  };
}
