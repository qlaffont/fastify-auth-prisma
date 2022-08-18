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
    console.log(response.body);
    expect(response.statusCode).toBe(401);
  });
});
