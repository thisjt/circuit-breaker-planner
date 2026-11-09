import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBucketDiagnostic } from '#lib/server/bucket';

export const GET: RequestHandler = async ({ platform }) => {
  const diagnostic = getBucketDiagnostic(platform);
  return json(diagnostic, {
    status: diagnostic.bucketAvailable ? 200 : 503
  });
};

