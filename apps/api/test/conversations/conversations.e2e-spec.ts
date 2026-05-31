import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { APP_URL } from '../utils/constants';

describe('Conversations — Guest Session Limit (e2e)', () => {
  const app = APP_URL;

  it('should allow 3 guest sessions and block the 4th', async () => {
    let deviceCookie: string | undefined;

    for (let i = 1; i <= 3; i++) {
      const res = await request(app)
        .post('/api/v1/conversations')
        .set('Cookie', deviceCookie ? [deviceCookie] : [])
        .expect(200);

      expect(res.body.token).toBeDefined();
      expect(res.body.expiresAt).toBeGreaterThan(Date.now());

      // Capture device cookie from first response
      if (i === 1) {
        const setCookieHeader = res.headers['set-cookie'] as
          | string[]
          | string
          | undefined;
        const cookies = Array.isArray(setCookieHeader)
          ? setCookieHeader
          : setCookieHeader
            ? [setCookieHeader]
            : [];
        deviceCookie = cookies
          .find((c: string) => c.startsWith('device-id='))
          ?.split(';')[0];
        expect(deviceCookie).toBeDefined();
      }
    }

    // 4th attempt must be blocked
    const blocked = await request(app)
      .post('/api/v1/conversations')
      .set('Cookie', deviceCookie ? [deviceCookie] : [])
      .expect(403);

    // ForbiddenException({ code, message }) is returned as-is by NestJS
    expect(blocked.body.code).toBe('GUEST_LIMIT_REACHED');
  });
});
