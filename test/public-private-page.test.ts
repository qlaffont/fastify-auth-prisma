/**
 * @jest-environment node
 */

import { describe, expect, it } from '@jest/globals';
import { FastifyInstance } from 'fastify';

import { PrismaClient } from '../prisma/generated/prisma-client-lib.ts';
import makeServer, { expiredTokenValue, userData } from './core/server';
import { cleanToken, generateToken } from './core/utils';

let server: FastifyInstance;

const prisma = new PrismaClient();

describe('Public/Private page', () => {
  describe('Public', () => {
    it('should be able to access page without token', async () => {
      server = await makeServer([{ url: '/public-success', method: 'GET' }]);

      const response = await server.inject({
        method: 'GET',
        url: '/public-success',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should be able to access page with token', async () => {
      server = await makeServer([{ url: '/public-success', method: 'GET' }]);

      const token = await generateToken();

      const response = await server.inject({
        method: 'GET',
        url: '/public-success',
        headers: {
          authorization: `Bearer ${token.accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      await cleanToken(token);
    });

    it('should be able to access page with invalid token', async () => {
      server = await makeServer([{ url: '/public-success', method: 'GET' }]);

      const response = await server.inject({
        method: 'GET',
        url: '/public-success',
        headers: {
          authorization: `Bearer thisisawrongtoken`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should be able to access page with expired token', async () => {
      server = await makeServer([{ url: '/public-success', method: 'GET' }]);

     await prisma.token.create({
        data: {
          accessToken: expiredTokenValue,
          refreshToken: 'test',
          ownerId: userData.id,
        },
      });

      const response = await server.inject({
        method: 'GET',
        url: '/public-success',
        headers: {
          authorization: `Bearer ${expiredTokenValue}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Private', () => {
    it('should return unauthorized if no token', async () => {
      server = await makeServer();

      const response = await server.inject({
        method: 'GET',
        url: '/not-public-success',
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body)).toStrictEqual({
        error: 'Unauthorized',
        context: { error: 'Page is not public' },
      });
    });

    it('should return page if token is valid', async () => {
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

    it('should return unauthorized token is invalid', async () => {
      server = await makeServer();

      const response = await server.inject({
        method: 'GET',
        url: '/not-public-success',
        headers: {
          authorization: `Bearer thisIsAWrongToken`,
        },
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body)).toStrictEqual({
        error: 'Unauthorized',
        context: { error: 'Page is not public' },
      });
    });

    it('should return unauthorized token is expired', async () => {
      server = await makeServer();

      await prisma.token.create({
        data: {
          accessToken: expiredTokenValue,
          refreshToken: 'test',
          ownerId: userData.id,
        },
      });

      const response = await server.inject({
        method: 'GET',
        url: '/not-public-success',
        headers: {
          authorization: `Bearer ${expiredTokenValue}`,
        },
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body)).toStrictEqual({
        error: 'Unauthorized',
        context: { error: 'Token is not valid' },
      });
    });
  });
});
