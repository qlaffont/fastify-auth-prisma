import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyRequest,
  HTTPMethods,
} from 'fastify';
import fp from 'fastify-plugin';
import { verify } from 'jsonwebtoken';
import { Unauthorized } from 'unify-errors';

import { currentUrlAndMethodIsAllowed } from './validateUrlIsPublic';

declare module 'fastify' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface ConnectedUser {}
  //@ts-ignore
  interface FastifyRequest {
    user?: ConnectedUser;
  }
}

export interface FastifyAuthPrismaUrlConfig {
  url: string;
  method: HTTPMethods;
}

export interface Options {
  config: FastifyAuthPrismaUrlConfig[];
  secret: string;
  //@ts-ignore
  prisma;
  userValidation?: (user: unknown) => Promise<void>;
}

const getAccessToken = (req: FastifyRequest) =>
  req.headers.authorization ||
  req.headers.Authorization ||
  (req.query as any)?.access_token ||
  undefined;

const fastifyAuthPrismaPlugin: FastifyPluginAsync<Options> = fp(
  async (fastify: FastifyInstance, options: Options) => {
    const config = options?.config || [];

    fastify.addHook('preValidation', async (req) => {
      const tokenValue: string | undefined = getAccessToken(req)
        ?.trim()
        ?.split(' ')[1];

      //Check if token existing
      if (tokenValue) {
        const token = await options.prisma.token.findFirst({
          where: { accessToken: tokenValue },
        });

        if (token) {
          try {
            verify(tokenValue, options.secret);
          } catch (error) {
            await options.prisma.token.delete({ where: { id: token.id } });

            //If token is not valid
            if (
              !currentUrlAndMethodIsAllowed(
                req.url,
                req.method as HTTPMethods,
                config,
              )
            ) {
              throw new Unauthorized({
                error: 'Valid token is missing',
              });
            }
          }

          const user = await options.prisma.user.findFirst({
            where: { id: token.ownerId },
          });

          options.userValidation && (await options.userValidation(user));

          req.user = user;
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
          error: 'Valid token is missing',
        });
      }
    });
  },
);

export default fastifyAuthPrismaPlugin;
