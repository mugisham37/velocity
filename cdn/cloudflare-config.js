// Cloudflare Workers configuration for KIRO ERP CDN optimization
// This script optimizes static asset delivery and implements intelligent caching

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const cache = caches.default;

  // Cache key includes version for cache busting
  const cacheKey = new Request(url.toString(), request);

  // Check if we have a cached response
  let response = await cache.match(cacheKey);

  if (response) {
    // Add cache hit header
    response = new Response(response.body, response);
    response.headers.set('CF-Cache-Status', 'HIT');
    return response;
  }

  // Fetch from origin
  response = await fetch(request);

  // Clone the response since we need to modify headers
  response = new Response(response.body, response);

  // Apply caching rules based on file type and path
  const cacheControl = getCacheControl(url.pathname);
  if (cacheControl) {
    response.headers.set('Cache-Control', cacheControl);
    response.headers.set('CF-Cache-Status', 'MISS');

    // Cache the response
    event.waitUntil(cache.put(cacheKey, response.clone()));
  }

  // Add performance headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Enable compression
  if (shouldCompress(url.pathname)) {
    response.headers.set('Content-Encoding', 'gzip');
  }

  return response;
}

function getCacheControl(pathname) {
  // Static assets with versioning - cache for 1 year
  if (
    pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)
  ) {
    if (pathname.includes('?v=') || pathname.includes('.min.')) {
      return 'public, max-age=31536000, immutable'; // 1 year
    }
    return 'public, max-age=86400'; // 1 day for non-versioned assets
  }

  // API responses - short cache for GET requests
  if (pathname.startsWith('/api/')) {
    if (pathname.includes('/reports/') || pathname.includes('/analytics/')) {
      return 'public, max-age=300'; // 5 minutes for reports
    }
    return 'no-cache'; // No cache for other API endpoints
  }

  // HTML pages - short cache
  if (pathname.endsWith('.html') || pathname === '/') {
    return 'public, max-age=300'; // 5 minutes
  }

  return null; // No caching
}

function shouldCompress(pathname) {
  return pathname.match(/\.(js|css|html|json|xml|txt|svg)$/);
}

// Advanced caching strategies
class CacheStrategy {
  static async staleWhileRevalidate(request, cacheTtl = 300) {
    const cache = caches.default;
    const cacheKey = new Request(request.url, request);

    // Get cached response
    const cachedResponse = await cache.match(cacheKey);

    // Fetch fresh response in background
    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        const responseToCache = response.clone();
        responseToCache.headers.set('Cache-Control', `max-age=${cacheTtl}`);
        cache.put(cacheKey, responseToCache);
      }
      return response;
    });

    // Return cached response immediately if available, otherwise wait for fetch
    return cachedResponse || (await fetchPromise);
  }

  static async cacheFirst(request, cacheTtl = 86400) {
    const cache = caches.default;
    const cacheKey = new Request(request.url, request);

    // Try cache first
    let response = await cache.match(cacheKey);

    if (!response) {
      // Fetch from origin
      response = await fetch(request);

      if (response.ok) {
        const responseToCache = response.clone();
        responseToCache.headers.set('Cache-Control', `max-age=${cacheTtl}`);
        await cache.put(cacheKey, responseToCache);
      }
    }

    return response;
  }

  static async networkFirst(request, cacheTtl = 300) {
    try {
      // Try network first
      const response = await fetch(request);

      if (response.ok) {
        const cache = caches.default;
        const cacheKey = new Request(request.url, request);
        const responseToCache = response.clone();
        responseToCache.headers.set('Cache-Control', `max-age=${cacheTtl}`);
        await cache.put(cacheKey, responseToCache);
      }

      return response;
    } catch (error) {
      // Fallback to cache
      const cache = caches.default;
      const cacheKey = new Request(request.url, request);
      const cachedResponse = await cache.match(cacheKey);

      if (cachedResponse) {
        return cachedResponse;
      }

      throw error;
    }
  }
}

// Image optimization
async function optimizeImage(request) {
  const url = new URL(request.url);

  // Extract optimization parameters from query string
  const width = url.searchParams.get('w');
  const height = url.searchParams.get('h');
  const quality = url.searchParams.get('q') || '85';
  const format = url.searchParams.get('f') || 'auto';

  // Build Cloudflare Image Resizing URL
  const imageUrl = `https://kiro-erp.com/cdn-cgi/image/width=${width || 'auto'},height=${height || 'auto'},quality=${quality},format=${format}/${url.pathname}`;

  return fetch(imageUrl);
}

// Security headers for API responses
function addSecurityHeaders(response) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  return response;
}

// Rate limiting for API endpoints
class RateLimiter {
  static async checkLimit(request, limit = 100, window = 60) {
    const ip = request.headers.get('CF-Connecting-IP');
    const key = `rate_limit:${ip}`;

    // This would require Cloudflare KV storage in production
    // For now, return true (allow all requests)
    return true;
  }
}
