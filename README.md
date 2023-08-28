[![Maintainability](https://api.codeclimate.com/v1/badges/6e747003545ffe76ceac/maintainability)](https://codeclimate.com/github/qlaffont/fastify-auth-prisma/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/6e747003545ffe76ceac/test_coverage)](https://codeclimate.com/github/qlaffont/fastify-auth-prisma/test_coverage) ![npm](https://img.shields.io/npm/v/fastify-auth-prisma) ![npm](https://img.shields.io/npm/dm/fastify-auth-prisma) ![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/fastify-auth-prisma) ![NPM](https://img.shields.io/npm/l/fastify-auth-prisma)

# Fastify-Auth-Prisma

Fastify plugin with Prisma to make simple & secure authentification middleware. Old Owner: [@flexper](https://github.com/flexper)

## Usage

```bash

pnpm install fastify-auth-prisma unify-fastify prisma @prisma/client

```

[Initialize Prisma](https://www.prisma.io/docs/getting-started) and create a similar schema.prisma

```prisma
model Token {
  id           String @id @unique @default(uuid())
  refreshToken String
  accessToken  String

  owner   User   @relation(fields: [ownerId], references: [id])
  ownerId String

  createdAt DateTime @default(now())
}

model User {
  id            String  @id @unique @default(uuid())

  tokens          Token[]

  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

```

Add your plugin in your fastify server

```typescript
import fastify from 'fastify';
import { PrismaClient, User } from '@prisma/client';
import unifyFastifyPlugin from 'unify-fastify';
import {fastifyAuthPrismaPlugin} from 'fastify-auth-prisma';

const prisma = new PrismaClient();
const server = fastify();

declare module 'fastify' {
  interface FastifyRequest {
    connectedUser?: User;
  }
}

await server.register(unifyFastifyPlugin);

await server.register(fastifyAuthPrismaPlugin, {
  config: [{url: "/public/*", method: 'GET'}],
  prisma,
  secret: process.env.JWT_ACCESS_SECRET, // Recommanded to use an external variable but you can use any generated string
});
```

## API

### fastifyAuthPrismaPlugin

**Options**

| Field Name     | Type                                             | Description                                                                        |
| -------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| config         | {url: string, method: HttpMethods}[]             | Specify which urls are allowed without valid token                                 |
| secret         | string                                           | Secret use for accessToken generation                                              |
| prisma         | Prisma Client                                    |                                                                                    |
| userValidation | (user: Prisma[User]) => Promise<void> [OPTIONAL] | Function to run to add userValidation on request (ex: isBanned / isEmailValidated) |

**Return**

| Field Name    | Type           | Description                   |
| ------------- | -------------- | ----------------------------- |
| connectedUser | Prisma["User"] | Connected user                |
| isConnected   | boolean        | Return if a user is connected |

### createUserToken(prisma)(userId, {secret, refreshSecret, accessTokenTime, refreshTokenTime})

**Options**
| Field Name       | Type          | Description                                                                         |
| ---------------- | ------------- | ----------------------------------------------------------------------------------- |
| prisma           | Prisma Client |                                                                                     |
| userId           | string        |                                                                                     |
| secret           | string        | Secret use for accessToken generation                                               |
| refreshSecret    | string?       | Secret use for refreshToken generation                                              |
| accessTokenTime  | string        | Time validity for accessToken [Help for time format](https://github.com/vercel/ms)  |
| refreshTokenTime | string        | Time validity for refreshToken [Help for time format](https://github.com/vercel/ms) |

**Return**

| Field Name   | Type   | Description |
| ------------ | ------ | ----------- |
| accessToken  | string |             |
| refreshToken | string |             |

### removeUserToken(prisma)(accessToken)

**Options**
| Field Name  | Type          | Description |
| ----------- | ------------- | ----------- |
| prisma      | Prisma Client |             |
| accessToken | string        |             |

**Return** void

### removeAllUserTokens(prisma)(userId)

**Options**
| Field Name | Type          | Description |
| ---------- | ------------- | ----------- |
| prisma     | Prisma Client |             |
| userId     | string        |             |

**Return** void

### refreshUserToken(prisma)(refreshToken, { secret, refreshSecret, accessTokenTime })

**Options**
| Field Name      | Type          | Description                                                                        |
| --------------- | ------------- | ---------------------------------------------------------------------------------- |
| prisma          | Prisma Client |                                                                                    |
| refreshToken    | string        | Refresh token generated                                                            |
| secret          | string        | Secret use for accessToken generation                                              |
| refreshSecret   | string        | Secret use for refreshToken generation                                             |
| accessTokenTime | string        | Time validity for accessToken [Help for time format](https://github.com/vercel/ms) |

**Return**

| Field Name   | Type   | Description |
| ------------ | ------ | ----------- |
| accessToken  | string |             |
| refreshToken | string |             |

### getAccessTokenFromRequest(req)

**Options**
| Field Name | Type            | Description |
| ---------- | --------------- | ----------- |
| req        | Fastify request |             |

**Return** string

## Config Array

To configure your public routes, you need to specify your url and your method. You can use some alias too :

- Standard example : `{url: '/test/toto', method: 'GET'}`
- Match url who start with test : `{url: '/test/*', method: 'GET'}`
- Match all methods for this url : `{url: '/test/toto', method: '*'}`
- Match url who contain dynamic variable in it : `{url: '/test/:var1/test', method: 'GET'}`

You can combine all this options of course ! `{url: '/test/:testvar/toto/*', method: '*'}`

## Test

To test this package, you need to run a PostgresSQL server :

```bash

docker-compose up -d
chmod -R 777 docker
pnpm prisma migrate deploy
pnpm test
```

## Maintain

This package use [TSdx](https://github.com/jaredpalmer/tsdx). Please check documentation to update this package.
