/**
 * @jest-environment node
 */

import { describe, expect, it } from '@jest/globals';
import { FastifyInstance } from 'fastify';

import makeServer, { userData } from './core/server';
import { cleanToken, generateToken } from './core/utils';

let server: FastifyInstance;

describe('Fastify Decorators', () => {
  describe('req.connectedUser', () => {
    it('should be able to get user if connected', async () => {
      server = await makeServer([]);

      const token = await generateToken();

      const response = await server.inject({
        method: 'GET',
        url: '/get-req-user',
        headers: {
          authorization: `Bearer ${token.accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toMatchObject({ id: userData.id });

      await cleanToken(token);
    });

    it('should be able to get nothing if not connected', async () => {
      server = await makeServer([{ url: '/get-req-user', method: 'GET' }]);

      const response = await server.inject({
        method: 'GET',
        url: '/get-req-user',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).not.toMatchObject({ id: userData.id });
    });
  });

  describe('req.isConnected', () => {
    it('should be able to return true if connected', async () => {
      server = await makeServer([]);

      const token = await generateToken();

      const response = await server.inject({
        method: 'GET',
        url: '/get-req-isConnected',
        headers: {
          authorization: `Bearer ${token.accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toStrictEqual({ isConnected: true });

      await cleanToken(token);
    });

    it('should be able to return false if not connected', async () => {
      server = await makeServer([
        { url: '/get-req-isConnected', method: 'GET' },
      ]);

      const response = await server.inject({
        method: 'GET',
        url: '/get-req-isConnected',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toStrictEqual({ isConnected: false });
    });
  });
});
