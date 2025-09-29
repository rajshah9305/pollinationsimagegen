import { useState, useEffect, useCallback } from 'react';
import { ImageModel } from '@/types';

// Enterprise-ready hook with proper error handling and retry logic
export function useImageModels() {
  const [models, setModels] = useState<ImageModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  const MAX_RETRIES = 3;
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache

  const fetchModels = useCallback(async (isRetry = false) => {
    try {
      // Prevent excessive API calls
      if (lastFetchTime && !isRetry && (Date.now() - lastFetchTime) < CACHE_DURATION) {
        console.log('Using cached models (hook level)');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      console.log(`${isRetry ? 'Retrying' : 'Fetching'} models from API...`);

      const response = await fetch('/api/test-models', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache', // Ensure fresh data from our API
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.models)) {
        // Transform API response to ImageModel format
        const transformedModels: ImageModel[] = data.models.map((modelId: string) => ({
          id: modelId,
          name: modelId.charAt(0).toUpperCase() + modelId.slice(1),
          description: getModelDescription(modelId)
        }));

        setModels(transformedModels);
        setLastFetchTime(Date.now());
        setRetryCount(0); // Reset retry count on success

        console.log(`Successfully loaded ${transformedModels.length} models:`, transformedModels.map(m => m.id));

        if (data.cached) {
          console.log('Models served from API cache');
        }
      } else {
        throw new Error(data.error || 'Invalid API response format');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models';

      console.error('Error fetching models:', errorMessage);

      // Retry logic for enterprise resilience
      if (retryCount < MAX_RETRIES && !isRetry) {
        console.log(`Retrying in ${2 ** retryCount} seconds... (${retryCount + 1}/${MAX_RETRIES})`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchModels(true);
        }, 1000 * (2 ** retryCount)); // Exponential backoff
        return;
      }

      setError(errorMessage);

      // Enterprise fallback - provide known working models
      const fallbackModels: ImageModel[] = [
        { id: 'flux', name: 'Flux', description: 'High-quality image generation model' },
        { id: 'turbo', name: 'Turbo', description: 'Fast image generation optimized for speed and efficiency' },
        { id: 'kontext', name: 'Kontext', description: 'Context-aware model that understands complex prompts better' },
      ];

      setModels(fallbackModels);
      console.warn('Using fallback models due to API failure');
    } finally {
      setLoading(false);
    }
  }, [retryCount, lastFetchTime]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Utility function to provide model descriptions
  function getModelDescription(modelId: string): string {
    const descriptions: Record<string, string> = {
      flux: 'High-quality image generation with excellent detail and coherence',
      turbo: 'Fast image generation optimized for speed and efficiency',
      kontext: 'Context-aware model that understands complex prompts better',
    };
    return descriptions[modelId] || 'Advanced AI image generation model';
  }

  return {
    models,
    loading,
    error,
    refetch: () => {
      setRetryCount(0);
      fetchModels();
    }
  };
}
