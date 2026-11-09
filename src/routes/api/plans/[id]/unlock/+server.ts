import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPassphrase } from '#lib/server/auth';
import { getPlansBucket, getBucketDiagnostic } from '#lib/server/bucket';

function sanitizeId(rawId: string): string {
  return rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
}

export const POST: RequestHandler = async ({ params, request, platform }) => {
  const bucket = getPlansBucket(platform);
  if (!bucket) {
    const diagnostic = getBucketDiagnostic(platform);
    return json(
      {
        error: 'bucket_unavailable',
        message: 'R2 bucket binding PLANS_BUCKET is not available.',
        diagnostic
      },
      { status: 503 }
    );
  }

  const id = sanitizeId(params.id);
  if (!id) {
    throw error(400, 'Invalid plan ID.');
  }

  const obj = await bucket.get(`plans/${id}.json`);
  if (!obj) {
    throw error(404, `Plan "${id}" was not found.`);
  }

  const meta = obj.customMetadata || {};
  if (meta.hasPassphrase !== 'true' || !meta.passphraseHash || !meta.passphraseSalt) {
    return json(
      {
        error: 'no_passphrase',
        message: 'This plan does not have an edit passphrase configured by the author.'
      },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { passphrase?: string };
  const passphrase = body.passphrase ? String(body.passphrase).trim() : '';

  if (!passphrase) {
    return json({ error: 'invalid', message: 'Passphrase is required.' }, { status: 400 });
  }

  const isValid = await verifyPassphrase(passphrase, meta.passphraseHash, meta.passphraseSalt);
  if (!isValid) {
    // Artificial delay to prevent automated high-speed brute-force dictionary attacks
    await new Promise((resolve) => setTimeout(resolve, 500));
    return json({ error: 'incorrect', message: 'Incorrect passphrase.' }, { status: 401 });
  }

  return json({
    authorized: true,
    id,
    editToken: meta.editToken || ''
  });
};
