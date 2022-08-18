/**
 * @jest-environment node
 */

import { describe, expect, it } from '@jest/globals';
import { FastifyInstance } from 'fastify';

import { PrismaClient } from '../prisma/generated/prisma-client-lib.ts';
import makeServer, { userData } from './core/server';
import { cleanToken, generateToken } from './core/utils';

let server: FastifyInstance;

const prisma = new PrismaClient();

const expiredTokenValue =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA0MzE5ZTA0LTA4ZDQtNDUyZi05YTQ2LTljMWY5ZTc5ZTJmMCIsImlhdCI6MTY2MDgyNDg2NSwiZXhwIjoxNjYwODI0ODY2fQ.aZOpXfb-1l-TlYzlaMBo-00J99I_NTP4ELuXpSgS6Lg';

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

      const token = await prisma.token.create({
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

      //Token should be deleted
      const existingToken = await prisma.token.findFirst({
        where: {
          id: token.id,
        },
      });

      expect(existingToken).toBe(null);
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

      const token = await prisma.token.create({
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

      //Token should be deleted
      const existingToken = await prisma.token.findFirst({
        where: {
          id: token.id,
        },
      });

      expect(existingToken).toBe(null);
    });
  });
});
