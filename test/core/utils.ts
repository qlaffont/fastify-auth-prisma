import { sign } from 'jsonwebtoken';

import {
  PrismaClient,
  Token,
} from '../../prisma/generated/prisma-client-lib.ts';
import { userData } from './server';

const prisma = new PrismaClient();

export const generateToken = async () => {
  const jwtAccessToken = await sign({ id: userData.id }, 'test', {
    expiresIn: '1s',
  });

  const jwtRefreshToken = await sign({ id: userData.id }, 'test', {
    expiresIn: '1d',
  });

  return prisma.token.create({
    data: {
      accessToken: jwtAccessToken,
      refreshToken: jwtRefreshToken,
      ownerId: userData.id,
    },
  });
};

export const cleanToken = async (token: Token) => {
  await prisma.token.delete({
    where: {
      id: token.id,
    },
  });
};
