// ⚠️ DO NOT MODIFY THIS FILE — it tests the project's health endpoint.

import request from 'supertest';
import app from '../../index.js';

describe('GET /api/health', () => {
  it('should return 200 status code', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('should return JSON body with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toEqual({ status: 'ok' });
  });
});
