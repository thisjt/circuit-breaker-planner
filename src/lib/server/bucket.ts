import { env } from 'cloudflare:workers';

export interface BucketDiagnostic {
  bucketAvailable: boolean;
  sources: {
    cloudflareWorkersEnv: {
      available: boolean;
      keys: string[];
      hasBucket: boolean;
      error?: string;
    };
    platformEnv: {
      available: boolean;
      keys: string[];
      hasBucket: boolean;
    };
    globalProxy: {
      available: boolean;
      keys: string[];
      hasBucket: boolean;
    };
  };
}

/**
 * Diagnostic inspector for Cloudflare runtime environment bindings.
 */
export function getBucketDiagnostic(platform?: App.Platform): BucketDiagnostic {
  const diag: BucketDiagnostic = {
    bucketAvailable: false,
    sources: {
      cloudflareWorkersEnv: { available: false, keys: [], hasBucket: false },
      platformEnv: { available: false, keys: [], hasBucket: false },
      globalProxy: { available: false, keys: [], hasBucket: false }
    }
  };

  // 1. cloudflare:workers env
  try {
    if (env && typeof env === 'object') {
      diag.sources.cloudflareWorkersEnv.available = true;
      // Note: env may be a Proxy, so we inspect its known keys and property access
      const keys = Object.keys(env);
      diag.sources.cloudflareWorkersEnv.keys = keys;
      if (Boolean(env.PLANS_BUCKET)) {
        diag.sources.cloudflareWorkersEnv.hasBucket = true;
        diag.bucketAvailable = true;
      }
    }
  } catch (e: any) {
    diag.sources.cloudflareWorkersEnv.error = String(e?.message || e);
  }

  // 2. SvelteKit platform.env
  if (platform?.env && typeof platform.env === 'object') {
    diag.sources.platformEnv.available = true;
    diag.sources.platformEnv.keys = Object.keys(platform.env);
    if (Boolean(platform.env.PLANS_BUCKET)) {
      diag.sources.platformEnv.hasBucket = true;
      diag.bucketAvailable = true;
    }
  }

  // 3. Local Miniflare / platformProxy fallback
  const globalPlatform = (globalThis as any).__sveltekit_cloudflare_platform;
  if (globalPlatform?.env && typeof globalPlatform.env === 'object') {
    diag.sources.globalProxy.available = true;
    diag.sources.globalProxy.keys = Object.keys(globalPlatform.env);
    if (Boolean(globalPlatform.env.PLANS_BUCKET)) {
      diag.sources.globalProxy.hasBucket = true;
      diag.bucketAvailable = true;
    }
  }

  return diag;
}

/**
 * Helper to retrieve the Cloudflare R2 PLANS_BUCKET binding.
 *
 * In @sveltejs/adapter-cloudflare v8:
 * - In Cloudflare production: bindings are accessed directly via `import { env } from 'cloudflare:workers'`.
 * - In local development: adapter-cloudflare provides a virtual proxy for `cloudflare:workers` that wraps Miniflare.
 * - Fallbacks: platform.env and globalThis.__sveltekit_cloudflare_platform.env are also checked.
 */
export function getPlansBucket(platform?: App.Platform): R2Bucket | undefined {
  // 1. Primary: cloudflare:workers runtime env
  try {
    if (env?.PLANS_BUCKET) {
      return env.PLANS_BUCKET;
    }
  } catch {
    // ignore
  }

  // 2. Secondary: event.platform.env
  if (platform?.env?.PLANS_BUCKET) {
    return platform.env.PLANS_BUCKET;
  }

  // 3. Tertiary: global platformProxy (Vite dev fallback)
  const globalPlatform = (globalThis as any).__sveltekit_cloudflare_platform;
  if (globalPlatform?.env?.PLANS_BUCKET) {
    return globalPlatform.env.PLANS_BUCKET;
  }

  return undefined;
}
