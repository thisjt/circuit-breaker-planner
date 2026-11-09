import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { CloudPlanSummary } from '#lib/types';

function generateShortId(length = 8): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}

export const GET: RequestHandler = async ({ platform }) => {
  const bucket = platform?.env?.PLANS_BUCKET;
  if (!bucket) {
    throw error(503, 'R2 bucket binding PLANS_BUCKET is not available.');
  }

  const listed = await bucket.list({
    prefix: 'plans/',
    include: ['customMetadata']
  });

  const plans: CloudPlanSummary[] = listed.objects
    .filter((obj) => obj.key.endsWith('.json'))
    .map((obj) => {
      const id = obj.key.replace(/^plans\//, '').replace(/\.json$/, '');
      const meta = obj.customMetadata || {};
      return {
        id,
        title: meta.title || 'Untitled Electrical Plan',
        author: meta.author || '',
        panelCount: parseInt(meta.panelCount || '1', 10) || 1,
        deviceCount: parseInt(meta.deviceCount || '0', 10) || 0,
        wireCount: parseInt(meta.wireCount || '0', 10) || 0,
        updatedAt: meta.updatedAt || obj.uploaded.toISOString(),
        sizeBytes: obj.size
      };
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return json({ plans });
};

export const POST: RequestHandler = async ({ request, platform }) => {
  const bucket = platform?.env?.PLANS_BUCKET;
  if (!bucket) {
    throw error(503, 'R2 bucket binding PLANS_BUCKET is not available.');
  }

  const body = (await request.json()) as Record<string, any>;
  if (!body || typeof body !== 'object') {
    throw error(400, 'Invalid plan payload.');
  }

  const id = generateShortId(8);
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

