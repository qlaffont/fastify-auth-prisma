import { PrismaClient } from '@prisma/client';
import { sign, verify } from 'jsonwebtoken';
import { BadRequest, NotFound } from 'unify-errors';

export const createUserToken =
  (prisma: PrismaClient) =>
  async (
    userId: string,
    {
      secret,
      refreshSecret,
      accessTokenTime,
      refreshTokenTime,
    }: {
      secret: string;
      refreshSecret?: string;
      accessTokenTime: string;
      refreshTokenTime: string;
    },
  ) => {
    try {
      await prisma.user.findFirstOrThrow({
        where: {
          id: userId,
        },
      });
    } catch (error) {
      throw new NotFound({ error: 'User not found' });
    }

    const accessToken = sign({ id: userId }, secret, {
      expiresIn: accessTokenTime,
    });

    const refreshToken = sign(
      { id: userId, date: new Date().getTime },
      refreshSecret || secret,
      {
        expiresIn: refreshTokenTime,
      },
    );

    await prisma.token.create({
      data: {
        accessToken,
        refreshToken,
        ownerId: userId,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  };

export const removeUserToken =
  (prisma: PrismaClient) => async (accessToken: string) => {
    await prisma.token.deleteMany({
      where: {
        accessToken,
      },
    });
  };

export const removeAllUserTokens =
  (prisma: PrismaClient) => async (userId: string) => {
    await prisma.token.deleteMany({
      where: {
        ownerId: userId,
      },
    });
  };

export const refreshUserToken =
  (prisma: PrismaClient) =>
  async (
    refreshToken: string,
    { secret, accessTokenTime }: { secret: string; accessTokenTime: string },
  ) => {
    try {
      verify(refreshToken, secret);
    } catch (error) {
      await prisma.token.deleteMany({
        where: {
          refreshToken: refreshToken,
        },
      });

      throw new BadRequest({
        error: 'Token expired',
      });
    }

    const token = await prisma.token.findFirst({
      where: {
        refreshToken,
      },
    });

    if (!token) {
      throw new NotFound({
        error: 'Token not found',
      });
    }

    // Renew Token
    const accessToken = sign({ id: token.ownerId }, secret, {
      expiresIn: accessTokenTime,
    });
    await prisma.token.update({
      where: {
        id: token.id,
      },
      data: {
        accessToken,
      },
    });

    return { accessToken, refreshToken };
  };
