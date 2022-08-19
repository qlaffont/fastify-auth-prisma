/**
 * @jest-environment node
 */

import { describe, it } from '@jest/globals';
import { sign } from 'jsonwebtoken';
import { BadRequest, NotFound } from 'unify-errors';

import { PrismaClient } from '../prisma/generated/prisma-client-lib.ts';
import {
  createUserToken,
  refreshUserToken,
  removeAllUserTokens,
  removeUserToken,
} from '../src';
import { expiredTokenValue, userData } from './core/server';

const prisma = new PrismaClient();
const secret = 'test';

describe('Utils function', () => {
  describe('createUserToken', () => {
    it('should be able to create token for existing user', async () => {
      const result = await createUserToken(prisma)(userData.id, {
        secret,
        accessTokenTime: '1d',
        refreshTokenTime: '7d',
      });

      const token = await prisma.token.findFirst({
        where: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });

      expect(token).toMatchObject({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      await prisma.token.delete({
        where: {
          id: token?.id,
        },
      });
    });

    it('should return NotFound if user is not found', async () => {
      try {
        await createUserToken(prisma)('wrongid', {
          secret,
          accessTokenTime: '1d',
          refreshTokenTime: '7d',
        });
      } catch (error) {
        expect(error).toStrictEqual(new NotFound({ error: 'User not found' }));
      }
    });
  });

  describe('removeUserToken', () => {
    it('should remove token ', async () => {
      const result = await createUserToken(prisma)(userData.id, {
        secret,
        accessTokenTime: '1d',
        refreshTokenTime: '7d',
      });

      await removeUserToken(prisma)(result.accessToken);

      const token = await prisma.token.findFirst({
        where: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });

      expect(token).toBe(null);
    });
  });

  describe('removeAllUserTokens', () => {
    it('should remove token ', async () => {
      const result = await createUserToken(prisma)(userData.id, {
        secret,
        accessTokenTime: '1d',
        refreshTokenTime: '7d',
      });

      await removeAllUserTokens(prisma)(userData.id);

      const token = await prisma.token.findFirst({
        where: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });

      expect(token).toBe(null);
    });
  });

  describe('refreshUserToken', () => {
    it('should be able to refresh user token ', async () => {
      const result = await createUserToken(prisma)(userData.id, {
        secret,
        accessTokenTime: '1d',
        refreshTokenTime: '7d',
      });

      const resultRefresh = await refreshUserToken(prisma)(
        result.refreshToken,
        {
          secret,
          accessTokenTime: '2d',
        },
      );

      expect(resultRefresh?.accessToken).not.toBe(result.accessToken);
    });

    it('should return a Bad request is token is expired ', async () => {
      try {
        await refreshUserToken(prisma)(expiredTokenValue, {
          secret,
          accessTokenTime: '1d',
        });
      } catch (error) {
        expect(error).toStrictEqual(new BadRequest({ error: 'Token expired' }));
      }
    });

    it("should return a Not Found if token doesn't exist", async () => {
      try {
        await refreshUserToken(prisma)(sign({ userId: 'test' }, secret), {
          secret,
          accessTokenTime: '1d',
        });
      } catch (error) {
        expect(error).toStrictEqual(new NotFound({ error: 'Token not found' }));
      }
    });
  });
});
