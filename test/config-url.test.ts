/**
 * @jest-environment node
 */

import { describe, expect, it } from '@jest/globals';
import { FastifyInstance } from 'fastify';

import makeServer, { methods } from './core/server';

let server: FastifyInstance;

describe('Confir Url', () => {
  it('should validate on url and method specified', async () => {
    server = await makeServer([{ url: '/public-success', method: 'GET' }]);

    const response = await server.inject({
      method: 'GET',
      url: '/public-success',
    });

    expect(response.statusCode).toBe(200);
  });

  it('should validate on url and method not specified', async () => {
    server = await makeServer([{ url: '/public-success', method: '*' }]);

    const response = await server.inject({
      method: 'GET',
      url: '/public-success',
    });

    expect(response.statusCode).toBe(200);
  });

  it('should validate on url and for each method', async () => {
    for (const method of methods) {
      server = await makeServer([
        { url: `/public-${method.toLowerCase()}`, method: method },
      ]);

      const response = await server.inject({
        //@ts-ignore
        method: method,
        url: `/public-${method.toLowerCase()}`,
      });

      //@ts-ignore
      expect(response.statusCode).toBe(200);
    }
  });

  it('should validate on url who contain parameter', async () => {
    server = await makeServer([
      {
        url: `/public-success/:variable1/tuto/:variable3/get`,
        method: 'GET',
      },
    ]);

    const response = await server.inject({
      method: 'GET',
      url: `/public-success/testvariable/tuto/test/get`,
    });

    expect(response.statusCode).toBe(200);
  });
});
