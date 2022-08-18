/**
 * @jest-environment node
 */

import { beforeEach, describe, expect, it } from '@jest/globals';
import { FastifyInstance } from 'fastify';

import makeServer from './core/server';

let server: FastifyInstance;

describe('Deps loading', () => {
  beforeEach(() => {
    server = makeServer();
  });

  it('Check if plugin is loaded', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/test',
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toStrictEqual({
      error: 'Unauthorized',
      context: { error: 'Valid token is missing' },
    });
  });
});
