/**
 * @jest-environment node
 */

import { describe, expect, it } from '@jest/globals';
import { FastifyInstance } from 'fastify';

import makeServer from './core/server';
import { cleanToken, generateToken } from './core/utils';

let server: FastifyInstance;

describe('Access Token value', () => {
  it('should be able to access token from authorization header', async () => {
    server = await makeServer();

    const token = await generateToken();

    const response = await server.inject({
      method: 'GET',
      url: '/not-public-success',
      headers: {
        authorization: `Bearer ${token.accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    await cleanToken(token);
  });

  it('should be able to access token from Authorization header', async () => {
    server = await makeServer();

    const token = await generateToken();

    const response = await server.inject({
      method: 'GET',
      url: '/not-public-success',
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    await cleanToken(token);
  });

  it('should be able to access token from access_token query param', async () => {
    server = await makeServer();

    const token = await generateToken();

    const response = await server.inject({
      method: 'GET',
      url: `/not-public-success?access_token=${encodeURIComponent(
        token.accessToken,
      )}`,
    });

    expect(response.statusCode).toBe(200);

    await cleanToken(token);
  });
});
