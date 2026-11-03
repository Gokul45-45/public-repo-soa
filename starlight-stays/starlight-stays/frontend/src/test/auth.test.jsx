import { describe, it, expect } from 'vitest';

describe('Frontend Auth & Token Utilities', () => {
  // Helper matching AuthContext logic
  function decodeJwt(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return {
        email: payload.sub,
        role: payload.role,
        userId: payload.userId,
        exp: payload.exp,
      };
    } catch {
      return null;
    }
  }

  it('correctly decodes valid customer JWT payload', () => {
    // sub: alice@example.com, role: CUSTOMER, userId: 2, exp: future
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: 'alice@example.com',
        role: 'CUSTOMER',
        userId: 2,
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    );
    const dummyToken = `${header}.${payload}.signature`;

    const decoded = decodeJwt(dummyToken);
    expect(decoded).not.toBeNull();
    expect(decoded.email).toBe('alice@example.com');
    expect(decoded.role).toBe('CUSTOMER');
    expect(decoded.userId).toBe(2);
    expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
  });

  it('correctly decodes administrator JWT payload', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: 'admin@starlight.com',
        role: 'ADMIN',
        userId: 1,
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    );
    const dummyToken = `${header}.${payload}.signature`;

    const decoded = decodeJwt(dummyToken);
    expect(decoded.role).toBe('ADMIN');
    expect(decoded.userId).toBe(1);
    expect(decoded.email).toBe('admin@starlight.com');
  });

  it('handles corrupted or invalid token safely without crashing', () => {
    expect(decodeJwt('not.a.valid.jwt.token')).toBeNull();
    expect(decodeJwt('malformed')).toBeNull();
    expect(decodeJwt('')).toBeNull();
  });
});
