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
import { fastifyAuthPrismaPlugin, FastifyAuthPrismaUrlConfig } from '../../src';
const prisma = new PrismaClient();

declare module 'fastify' {
  interface FastifyRequest {
    connectedUser?: User;
  }
}

export const userData = {
  id: '04319e04-08d4-452f-9a46-9c1f9e79e2f0',
} as User;

export const expiredTokenValue =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA0MzE5ZTA0LTA4ZDQtNDUyZi05YTQ2LTljMWY5ZTc5ZTJmMCIsImlhdCI6MTY2MDgyNDg2NSwiZXhwIjoxNjYwODI0ODY2fQ.aZOpXfb-1l-TlYzlaMBo-00J99I_NTP4ELuXpSgS6Lg';

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
  userValidation?: (user: User) => Promise<void>,
): Promise<FastifyInstance> => {
  const server = fastify();

  await server.register(unifyFastifyPlugin);

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

  await server.get('/get-req-user', (req: FastifyRequest, res: FastifyReply) =>
    res.send(req.connectedUser || {}),
  );
  await server.get(
    '/get-req-isConnected',
    (req: FastifyRequest, res: FastifyReply) =>
      res.send({ isConnected: req.isConnected }),
  );

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
