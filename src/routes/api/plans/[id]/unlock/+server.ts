import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPassphrase } from '#lib/server/auth';
import { getPlansBucket } from '#lib/server/bucket';

function sanitizeId(rawId: string): string {
  return rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
}

export const POST: RequestHandler = async ({ params, request, platform }) => {
  const bucket = getPlansBucket(platform);
  if (!bucket) {
    throw error(503, 'R2 bucket binding PLANS_BUCKET is not available.');
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
    return json({ error: 'incorrect', message: 'Incorrect passphrase.' }, { status: 401 });
  }

  return json({
    authorized: true,
    id,
    editToken: meta.editToken || ''
  });
};
