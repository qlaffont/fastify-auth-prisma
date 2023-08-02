import { FastifyInstance, FastifyRequest, HTTPMethods } from 'fastify';
import { verify } from 'jsonwebtoken';
import { Unauthorized } from 'unify-errors';
//@ts-ignore
const fp = require('fastify-plugin');

import { currentUrlAndMethodIsAllowed } from './currentUrlAndMethodIsAllowed';

declare module 'fastify' {
  //@ts-ignore
  interface FastifyRequest {
    isConnected?: boolean;
  }
}

export interface FastifyAuthPrismaUrlConfig {
  url: string;
  method: HTTPMethods | '*';
}

export interface Options {
  config?: FastifyAuthPrismaUrlConfig[];
  secret: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userValidation?: (user: any) => Promise<void>;
}

export const getAccessTokenFromRequest = (req: FastifyRequest) => {
  let token: string | undefined;

  if ((req.query as { access_token: string }).access_token) {
    token = (req.query as { access_token: string }).access_token;
  }

  if (req.headers.authorization) {
    token = (req.headers.authorization as string).trim().split(' ')[1];
  }

  return token;
};

export const fastifyAuthPrismaPlugin = fp(
  async (fastify: FastifyInstance, options: Options) => {
    const config = options?.config || [];

    fastify.decorateRequest('connectedUser', undefined);
    fastify.decorateRequest('isConnected', false);

    fastify.addHook('preValidation', async (req) => {
      req.isConnected = false;

      const tokenValue: string | undefined = getAccessTokenFromRequest(req);

      //Check if token existing
      if (tokenValue) {
        const token = await options.prisma.token.findFirst({
          where: { accessToken: tokenValue },
        });

        if (token) {
          try {
            verify(tokenValue, options.secret);
          } catch (error) {
            //If token is not valid and If user is not connected and url is not public
            if (
              !currentUrlAndMethodIsAllowed(
                req.url,
                req.method as HTTPMethods,
                config,
              )
            ) {
              await options.prisma.token.delete({ where: { id: token.id } });
              throw new Unauthorized({
                error: 'Token is not valid',
              });
            }

            return;
          }

          const user = await options.prisma.user.findFirst({
            where: { id: token.ownerId },
          });

          options.userValidation && (await options.userValidation(user));

          //@ts-ignore
          req.connectedUser = user;
          req.isConnected = true;
          return;
        }
      }

      // If user is not connected and url is not public
      if (
        !currentUrlAndMethodIsAllowed(
          req.url,
          req.method as HTTPMethods,
          config,
        )
      ) {
        throw new Unauthorized({
          error: 'Page is not public',
        });
      }
    });
  },
  {
    fastify: '4.x',
    name: 'fastify-auth-prisma',
  },
);
