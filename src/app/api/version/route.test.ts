import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('/api/version route', () => {
  it('returns valid JSON with version and timestamp', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('version');
    expect(typeof data.version).toBe('string');
    expect(data).toHaveProperty('timestamp');
    expect(typeof data.timestamp).toBe('number');
  });

  it('includes no-cache headers to ensure accurate update polling', async () => {
    const res = await GET();
    const cacheControl = res.headers.get('Cache-Control');
    expect(cacheControl).toContain('no-store');
  });
});
