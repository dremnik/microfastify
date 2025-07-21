import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

type Handler<TSchema extends z.ZodType> = (
  request: FastifyRequest,
  reply: FastifyReply,
  data: z.infer<TSchema>
) => Promise<any> | any;

export class Router {
  constructor(private fastify: FastifyInstance) {}

  get<TSchema extends z.ZodType>(
    path: string,
    schema: TSchema,
    handler: Handler<TSchema>
  ) {
    this.fastify.withTypeProvider<ZodTypeProvider>().route({
      method: 'GET',
      url: path,
      schema: { querystring: schema },
      handler: async (req, reply) => handler(req, reply, req.query as z.infer<TSchema>),
    });
  }

  post<TSchema extends z.ZodType>(
    path: string,
    schema: TSchema,
    handler: Handler<TSchema>
  ) {
    this.fastify.withTypeProvider<ZodTypeProvider>().route({
      method: 'POST',
      url: path,
      schema: { body: schema },
      handler: async (req, reply) => handler(req, reply, req.body as z.infer<TSchema>),
    });
  }

  put<TSchema extends z.ZodType>(
    path: string,
    schema: TSchema,
    handler: Handler<TSchema>
  ) {
    this.fastify.withTypeProvider<ZodTypeProvider>().route({
      method: 'PUT',
      url: path,
      schema: { body: schema },
      handler: async (req, reply) => handler(req, reply, req.body as z.infer<TSchema>),
    });
  }

  patch<TSchema extends z.ZodType>(
    path: string,
    schema: TSchema,
    handler: Handler<TSchema>
  ) {
    this.fastify.withTypeProvider<ZodTypeProvider>().route({
      method: 'PATCH',
      url: path,
      schema: { body: schema },
      handler: async (req, reply) => handler(req, reply, req.body as z.infer<TSchema>),
    });
  }

  delete<TSchema extends z.ZodType>(
    path: string,
    schema: TSchema,
    handler: Handler<TSchema>
  ) {
    this.fastify.withTypeProvider<ZodTypeProvider>().route({
      method: 'DELETE',
      url: path,
      schema: { querystring: schema },
      handler: async (req, reply) => handler(req, reply, req.query as z.infer<TSchema>),
    });
  }
}