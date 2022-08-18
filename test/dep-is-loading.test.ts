/**
 * @jest-environment node
 */

import { beforeEach, describe, expect, it } from '@jest/globals';
import { FastifyInstance } from 'fastify';

import makeServer from './core/server';

let server: FastifyInstance;

describe('Deps loading', () => {
  beforeEach(async () => {
    server = await makeServer();
  });

  it('Check if plugin is loaded', async () => {
    expect(server.printPlugins()).toContain('fastify-auth-prisma');
  });
});
