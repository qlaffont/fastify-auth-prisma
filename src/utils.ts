/* eslint-disable @typescript-eslint/no-explicit-any */
import { sign, verify } from 'jsonwebtoken';
import { BadRequest, NotFound } from 'unify-errors';

export const createUserToken =
  (prisma: any) =>
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

export const removeUserToken = (prisma: any) => async (accessToken: string) => {
  await prisma.token.deleteMany({
    where: {
      accessToken,
    },
  });
};

export const removeAllUserTokens = (prisma: any) => async (userId: string) => {
  await prisma.token.deleteMany({
    where: {
      ownerId: userId,
    },
  });
};

export const refreshUserToken =
  (prisma: any) =>
  async (
    refreshToken: string,
    {
      secret,
      refreshSecret,
      accessTokenTime,
    }: { secret: string; refreshSecret?: string; accessTokenTime: string },
  ) => {
    try {
      verify(refreshToken, refreshSecret || secret);
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
