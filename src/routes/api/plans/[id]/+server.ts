import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateEditToken, hashPassphrase, verifyPassphrase } from '#lib/server/auth';
import { getPlansBucket } from '#lib/server/bucket';

function sanitizeId(rawId: string): string {
  return rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
}

export const GET: RequestHandler = async ({ params, request, platform }) => {
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
    throw error(404, `Plan "${id}" was not found in cloud storage.`);
  }

  const text = await obj.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw error(500, 'Stored plan JSON is corrupted.');
  }

  const meta = obj.customMetadata || {};
  const clientToken = request.headers.get('x-edit-token');
  const hasPassphrase = meta.hasPassphrase === 'true';
  const canEdit = meta.editToken ? clientToken === meta.editToken : true;

  return json({
    id,
    title: meta.title || data.projectTitle || data.config?.name || 'Untitled Electrical Plan',
    author: meta.author || data.projectAuthor || '',
    updatedAt: meta.updatedAt || data.updatedAt || obj.uploaded.toISOString(),
    hasPassphrase,
    canEdit,
    data
  });
};

export const PUT: RequestHandler = async ({ params, request, platform }) => {
  const bucket = getPlansBucket(platform);
  if (!bucket) {
    throw error(503, 'R2 bucket binding PLANS_BUCKET is not available.');
  }

  const id = sanitizeId(params.id);
  if (!id) {
    throw error(400, 'Invalid plan ID.');
  }

  const existingObj = await bucket.get(`plans/${id}.json`);
  if (!existingObj) {
    throw error(404, `Plan "${id}" does not exist.`);
  }

  const existingMeta = existingObj.customMetadata || {};
  const body = (await request.json()) as Record<string, any>;
  if (!body || typeof body !== 'object') {
    throw error(400, 'Invalid plan payload.');
  }

  // Verify Edit Authorization
  const clientToken = request.headers.get('x-edit-token') || body.editToken;
  const clientPassphrase = request.headers.get('x-passphrase') || body.passphrase;

  let isAuthorized = false;
  if (!existingMeta.editToken) {
    isAuthorized = true;
  } else if (clientToken && clientToken === existingMeta.editToken) {
    isAuthorized = true;
  } else if (
    existingMeta.hasPassphrase === 'true' &&
    existingMeta.passphraseHash &&
    existingMeta.passphraseSalt &&
    clientPassphrase
  ) {
    isAuthorized = await verifyPassphrase(
      String(clientPassphrase).trim(),
      existingMeta.passphraseHash,
      existingMeta.passphraseSalt
    );
  }

  if (!isAuthorized) {
    return json(
      {
        error: 'unauthorized',
        message:
          'This plan is protected. Author edit token or collaborator passphrase required to overwrite.',
        hasPassphrase: existingMeta.hasPassphrase === 'true'
      },
      { status: 403 }
    );
  }

  const now = new Date().toISOString();
  const title = String(body.projectTitle || body.config?.name || 'Residential Distribution Plan').slice(0, 120);
  const author = String(body.projectAuthor || '').slice(0, 80);
  const panelCount = Array.isArray(body.panels) ? body.panels.length : 1;
  const deviceCount = Array.isArray(body.devices) ? body.devices.length : 0;
  const wireCount = Array.isArray(body.wires) ? body.wires.length : 0;

  const editToken = existingMeta.editToken || generateEditToken();
  const customMetadata: Record<string, string> = {
    ...existingMeta,
    title,
    author,
    panelCount: String(panelCount),
    deviceCount: String(deviceCount),
    wireCount: String(wireCount),
    updatedAt: now,
    editToken
  };

  if (body.removePassphrase === true) {
    customMetadata.hasPassphrase = 'false';
    delete customMetadata.passphraseHash;
    delete customMetadata.passphraseSalt;
  } else if (typeof body.newPassphrase === 'string' && body.newPassphrase.trim()) {
    const { hash, salt } = await hashPassphrase(body.newPassphrase.trim());
    customMetadata.hasPassphrase = 'true';
    customMetadata.passphraseHash = hash;
    customMetadata.passphraseSalt = salt;
  }

  const payload = {
    ...body,
    cloudPlanId: id,
    projectTitle: title,
    projectAuthor: author,
    updatedAt: now
  };
  delete (payload as any).passphrase;
  delete (payload as any).newPassphrase;
  delete (payload as any).removePassphrase;

  await bucket.put(`plans/${id}.json`, JSON.stringify(payload), {
    httpMetadata: {
      contentType: 'application/json'
    },
    customMetadata
  });

  return json({
    id,
    url: `/plan/${id}`,
    title,
    author,
    updatedAt: now,
    editToken,
    hasPassphrase: customMetadata.hasPassphrase === 'true',
    canEdit: true
  });
};

export const DELETE: RequestHandler = async ({ params, request, platform }) => {
  const bucket = getPlansBucket(platform);
  if (!bucket) {
    throw error(503, 'R2 bucket binding PLANS_BUCKET is not available.');
  }

  const id = sanitizeId(params.id);
  if (!id) {
    throw error(400, 'Invalid plan ID.');
  }

  const existingObj = await bucket.get(`plans/${id}.json`);
  if (!existingObj) {
    return json({ deleted: true, id });
  }

  const existingMeta = existingObj.customMetadata || {};
  const clientToken = request.headers.get('x-edit-token');
  const clientPassphrase = request.headers.get('x-passphrase');

  let isAuthorized = false;
  if (!existingMeta.editToken) {
    isAuthorized = true;
  } else if (clientToken && clientToken === existingMeta.editToken) {
    isAuthorized = true;
  } else if (
    existingMeta.hasPassphrase === 'true' &&
    existingMeta.passphraseHash &&
    existingMeta.passphraseSalt &&
    clientPassphrase
  ) {
    isAuthorized = await verifyPassphrase(
      String(clientPassphrase).trim(),
      existingMeta.passphraseHash,
      existingMeta.passphraseSalt
    );
  }

  if (!isAuthorized) {
    return json(
      {
        error: 'unauthorized',
        message: 'Owner edit token or valid passphrase required to delete this plan.'
      },
      { status: 403 }
    );
  }

  await bucket.delete(`plans/${id}.json`);
  return json({ deleted: true, id });
};
