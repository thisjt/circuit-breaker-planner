/**
 * Helper to retrieve the Cloudflare R2 PLANS_BUCKET binding.
 * Works seamlessly in both Cloudflare Worker production (via platform.env)
 * and local Vite development (via adapter-cloudflare Miniflare platform proxy).
 */
export function getPlansBucket(platform: App.Platform | undefined): R2Bucket | undefined {
  if (platform?.env?.PLANS_BUCKET) {
    return platform.env.PLANS_BUCKET;
  }
  const globalPlatform = (globalThis as any).__sveltekit_cloudflare_platform;
  if (globalPlatform?.env?.PLANS_BUCKET) {
    return globalPlatform.env.PLANS_BUCKET;
  }
  return undefined;
}

