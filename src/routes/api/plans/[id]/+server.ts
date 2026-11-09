import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function sanitizeId(rawId: string): string {
  return rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
}

export const GET: RequestHandler = async ({ params, platform }) => {
  const bucket = platform?.env?.PLANS_BUCKET;
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
  return json({
    id,
    title: meta.title || data.projectTitle || data.config?.name || 'Untitled Electrical Plan',
    author: meta.author || data.projectAuthor || '',
    updatedAt: meta.updatedAt || data.updatedAt || obj.uploaded.toISOString(),
    data
  });
};

export const PUT: RequestHandler = async ({ params, request, platform }) => {
  const bucket = platform?.env?.PLANS_BUCKET;
  if (!bucket) {
    throw error(503, 'R2 bucket binding PLANS_BUCKET is not available.');
  }

  const id = sanitizeId(params.id);
  if (!id) {
    throw error(400, 'Invalid plan ID.');
  }

  const body = (await request.json()) as Record<string, any>;
  if (!body || typeof body !== 'object') {
    throw error(400, 'Invalid plan payload.');
  }

  const now = new Date().toISOString();
  const title = String(body.projectTitle || body.config?.name || 'Residential Distribution Plan').slice(0, 120);
  const author = String(body.projectAuthor || '').slice(0, 80);
  const panelCount = Array.isArray(body.panels) ? body.panels.length : 1;
  const deviceCount = Array.isArray(body.devices) ? body.devices.length : 0;
  const wireCount = Array.isArray(body.wires) ? body.wires.length : 0;

  const payload = {
    ...body,
    cloudPlanId: id,
    projectTitle: title,
    projectAuthor: author,
    updatedAt: now
  };

  await bucket.put(`plans/${id}.json`, JSON.stringify(payload), {
    httpMetadata: {
      contentType: 'application/json'
    },
    customMetadata: {
      title,
      author,
      panelCount: String(panelCount),
      deviceCount: String(deviceCount),
      wireCount: String(wireCount),
      updatedAt: now
    }
  });

  return json({
    id,
    url: `/plan/${id}`,
    title,
    author,
    updatedAt: now
  });
};

export const DELETE: RequestHandler = async ({ params, platform }) => {
  const bucket = platform?.env?.PLANS_BUCKET;
  if (!bucket) {
    throw error(503, 'R2 bucket binding PLANS_BUCKET is not available.');
  }

  const id = sanitizeId(params.id);
  if (!id) {
    throw error(400, 'Invalid plan ID.');
  }

  await bucket.delete(`plans/${id}.json`);
  return json({ deleted: true, id });
};

