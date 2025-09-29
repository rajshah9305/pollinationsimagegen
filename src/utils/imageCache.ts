// Image caching utility for performance optimization
interface CachedImage {
  url: string;
  prompt: string;
  model: string;
  params: any;
  timestamp: number;
  blob?: Blob;
}

class ImageCache {
  private cache = new Map<string, CachedImage>();
  private maxSize = 50; // Maximum number of cached images
  private maxAge = 60 * 60 * 1000; // 1 hour cache age

  // Generate cache key from prompt and parameters
  private getCacheKey(prompt: string, params: any): string {
    const key = `${prompt.trim().toLowerCase()}_${params.model}_${params.width}_${params.height}_${params.seed || 'no-seed'}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  // Get cached image
  get(prompt: string, params: any): CachedImage | null {
    const key = this.getCacheKey(prompt, params);
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  // Set cached image
  set(prompt: string, params: any, url: string, blob?: Blob): void {
    const key = this.getCacheKey(prompt, params);

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      url,
      prompt,
      model: params.model,
      params,
      timestamp: Date.now(),
      blob
    });
  }

  // Clear expired entries
  clearExpired(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, cached]) => {
      if (now - cached.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    });
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache stats
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// Export singleton instance
export const imageCache = new ImageCache();