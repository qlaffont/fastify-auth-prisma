import fastify, { FastifyInstance } from 'fastify';
import unifyFastifyPlugin from 'unify-fastify';

import { PrismaClient } from '../../prisma/generated/prisma-client-lib.ts';
const prisma = new PrismaClient();

import fastifyAuthPrismaPlugin, { FastifyAuthPrismaUrlConfig } from '../../src';

const makeServer = (
  config: FastifyAuthPrismaUrlConfig[] = [],
): FastifyInstance => {
  const server = fastify();

  server.register(unifyFastifyPlugin, { hideContextOnProd: false });

  server
    .register(fastifyAuthPrismaPlugin, {
      config,
      prisma,
      secret: 'test',
    })
    .after((err) => {
      if (err) throw err;
    });

  return server;
};

export default makeServer;
