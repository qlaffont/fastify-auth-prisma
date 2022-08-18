//@ts-nocheck
import fastify from 'fastify';
import unifyFastifyPlugin from 'unify-fastify';

import { PrismaClient } from '../../prisma/generated/prisma-client-lib.ts';
const prisma = new PrismaClient();

import fastifyAuthPrismaPlugin from '../../src';

(async () => {
  const server = fastify();

  await server.register(unifyFastifyPlugin, { hideContextOnProd: false });

  await server
    .register(fastifyAuthPrismaPlugin, {
      config: [],
      prisma,
      secret: 'test',
    })
    .after((err) => {
      if (err) throw err;
    });

  server.listen({ port: 3000 }).then(() => console.log('ready'));
})();
