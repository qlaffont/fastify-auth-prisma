import fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  HTTPMethods,
} from 'fastify';
import unifyFastifyPlugin from 'unify-fastify';

import {
  PrismaClient,
  User,
} from '../../prisma/generated/prisma-client-lib.ts';
const prisma = new PrismaClient();

import fastifyAuthPrismaPlugin, { FastifyAuthPrismaUrlConfig } from '../../src';

export const userData = {
  id: '04319e04-08d4-452f-9a46-9c1f9e79e2f0',
} as User;

export const methods = [
  'DELETE',
  'GET',
  'HEAD',
  'PATCH',
  'POST',
  'PUT',
  'OPTIONS',
  'PROPFIND',
  'PROPPATCH',
  'MKCOL',
  'COPY',
  'MOVE',
  'LOCK',
  'UNLOCK',
  'TRACE',
  'SEARCH',
] as HTTPMethods[];

const makeServer = async (
  config?: FastifyAuthPrismaUrlConfig[],
  userValidation?: (user: unknown) => Promise<void>,
): Promise<FastifyInstance> => {
  const server = fastify();

  await server.register(unifyFastifyPlugin, { hideContextOnProd: false });

  await server.register(fastifyAuthPrismaPlugin, {
    config,
    prisma,
    secret: 'test',
    userValidation,
  });

  const successHandler = (_: FastifyRequest, res: FastifyReply) =>
    res.send({ success: true });

  await server.get('/public-success', successHandler);
  await server.get(
    '/public-success/:variable1/:variable2/:variable3/get',
    successHandler,
  );

  await server.get('/not-public-success', successHandler);

  const user = await prisma.user.findFirst({
    where: {
      id: userData.id,
    },
  });

  if (!user) {
    await prisma.user.create({
      data: userData,
    });
  }

  for (const method of methods) {
    await server.route({
      url: `/public-${method.toLowerCase()}`,
      method,
      handler: successHandler,
    });
  }

  return server;
};

export default makeServer;
