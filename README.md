[![Maintainability](https://api.codeclimate.com/v1/badges/6e747003545ffe76ceac/maintainability)](https://codeclimate.com/github/flexper/fastify-auth-prisma/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/6e747003545ffe76ceac/test_coverage)](https://codeclimate.com/github/flexper/fastify-auth-prisma/test_coverage) ![npm](https://img.shields.io/npm/v/fastify-auth-prisma) ![npm](https://img.shields.io/npm/dm/fastify-auth-prisma) ![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/fastify-auth-prisma) ![NPM](https://img.shields.io/npm/l/fastify-auth-prisma)

# Fastify-Auth-Prisma

Fasitfy plugin with Prisma to make simple and secure authentification middleware

## Usage

```bash

pnpm install fastify-auth-prisma unify-fastify

```

Init Prisma and create a similar schema.prisma

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
import { PrismaClient } from '@prisma/client';
import unifyFastifyPlugin from 'unify-fastify';
import {fastifyAuthPrismaPlugin} from 'fastify-auth-prisma';

const prisma = new PrismaClient();
const server = fastify();

await server.register(unifyFastifyPlugin, { hideContextOnProd: false });

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

| Field Name  | Type           | Description                   |
| ----------- | -------------- | ----------------------------- |
| user        | Prisma["User"] | Connected user                |
| isConnected | boolean        | Return if a user is connected |


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

### refreshUserToken(prisma)(refreshToken)

**Options**
| Field Name   | Type          | Description |
| ------------ | ------------- | ----------- |
| prisma       | Prisma Client |             |
| refreshToken | string        |             |

**Return**

| Field Name   | Type   | Description |
| ------------ | ------ | ----------- |
| accessToken  | string |             |
| refreshToken | string |             |

## Test

To test this package, you need to run a PostgresSQL server :

```bash

docke-compose up -d
chmod -R 777 docker
pnpm prisma migrate deploy
pnpm test
```

## Maintain

This package use [TSdx](https://github.com/jaredpalmer/tsdx). Please check documentation to update this package.
