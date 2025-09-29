import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Cache configuration for production
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
let cachedModels: string[] | null = null;
let cacheTimestamp: number | null = null;

// Production-ready API endpoint with proper error handling and caching
export async function GET() {
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const clientIP = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';

    // Check cache first (production optimization)
    if (cachedModels && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      console.log(`[${new Date().toISOString()}] Models cache hit for IP: ${clientIP}`);
      return NextResponse.json({
        success: true,
        models: cachedModels,
        cached: true,
        timestamp: cacheTimestamp
      });
    }

    console.log(`[${new Date().toISOString()}] Fetching fresh models from Pollinations API for IP: ${clientIP}`);

    // Fetch from Pollinations API with timeout and proper error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://image.pollinations.ai/models', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Pollinations-Image-Generator/1.0.0',
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Pollinations API responded with status: ${response.status}`);
    }

    const models: string[] = await response.json();

    // Validate response format
    if (!Array.isArray(models)) {
      throw new Error('Invalid response format from Pollinations API');
    }

    // Filter out unwanted models for enterprise use (remove nanobanana)
    const filteredModels = models.filter(model =>
      model &&
      typeof model === 'string' &&
      model.toLowerCase() !== 'nanobanana'
    );

    // Ensure we have at least the core models as fallback
    const coreModels = ['flux', 'turbo', 'kontext'];
    const finalModels = filteredModels.length > 0 ? filteredModels : coreModels;

    // Update cache
    cachedModels = finalModels;
    cacheTimestamp = Date.now();

    console.log(`[${new Date().toISOString()}] Successfully fetched ${finalModels.length} models: ${finalModels.join(', ')}`);

    return NextResponse.json({
      success: true,
      models: finalModels,
      cached: false,
      timestamp: cacheTimestamp,
      source: 'pollinations-api'
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching models:`, error);

    // Enterprise fallback - return known working models
    const fallbackModels = ['flux', 'turbo', 'kontext'];

    // Don't update cache with fallback data
    if (!cachedModels) {
      cachedModels = fallbackModels;
      cacheTimestamp = Date.now();
    }

    return NextResponse.json(
      {
        success: false,
        models: fallbackModels,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fallback: true,
        timestamp: Date.now()
      },
      {
        status: 200, // Return 200 even with fallback to prevent client errors
        headers: {
          'X-Fallback-Used': 'true',
          'X-Error-Message': error instanceof Error ? error.message : 'Unknown error'
        }
      }
    );
  }
}

// Add OPTIONS handler for CORS preflight requests (enterprise readiness)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}