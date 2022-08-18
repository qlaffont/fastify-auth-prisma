/**
 * @jest-environment node
 */

import { describe, expect, it } from '@jest/globals';
import { FastifyInstance } from 'fastify';

import makeServer from './core/server';
import { cleanToken, generateToken } from './core/utils';

let server: FastifyInstance;

describe('Default', () => {
  it('should return Unauthorized, if url is not in config and no token', async () => {
    server = await makeServer();

    const response = await server.inject({
      method: 'GET',
      url: '/public-success',
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toStrictEqual({
      error: 'Unauthorized',
      context: { error: 'Page is not public' },
    });
  });

  it('should return page, if url is not in config and token', async () => {
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
});
