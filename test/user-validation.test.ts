/**
 * @jest-environment node
 */

import { describe, expect, it } from '@jest/globals';
import { FastifyInstance } from 'fastify';

import { User } from '../prisma/generated/prisma-client-lib.ts';
import makeServer, { userData } from './core/server';
import { cleanToken, generateToken } from './core/utils';

let server: FastifyInstance;

describe('User validation', () => {
  it('should execute user validation', async () => {
    let connectedUserId;

    server = await makeServer([], async (user) => {
      connectedUserId = (user as User).id;
    });

    const token = await generateToken();

    const response = await server.inject({
      method: 'GET',
      url: '/not-public-success',
      headers: {
        authorization: `Bearer ${token.accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(connectedUserId).toBe(userData.id);

    await cleanToken(token);
  });
});
