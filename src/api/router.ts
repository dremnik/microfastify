import {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  RouteGenericInterface,
} from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

type SchemaObject = {
  querystring?: z.ZodType;
  params?: z.ZodType;
  body?: z.ZodType;
};

export type Handler<T extends RouteGenericInterface = RouteGenericInterface> = (
  request: FastifyRequest<T>,
  reply: FastifyReply,
) => Promise<any> | any;

export class Router {
  constructor(private fastify: FastifyInstance) {}

  get<T extends RouteGenericInterface>(
    path: string,
    schema: SchemaObject,
    handler: Handler<T>,
  ) {
    this.fastify.withTypeProvider<ZodTypeProvider>().route({
      method: "GET",
      url: path,
      schema,
      handler,
    });
  }

  post<T extends RouteGenericInterface>(
    path: string,
    schema: SchemaObject,
    handler: Handler<T>,
  ) {
    this.fastify.withTypeProvider<ZodTypeProvider>().route({
      method: "POST",
      url: path,
      schema,
      handler,
    });
  }

  put<T extends RouteGenericInterface>(
    path: string,
    schema: SchemaObject,
    handler: Handler<T>,
  ) {
    this.fastify.withTypeProvider<ZodTypeProvider>().route({
      method: "PUT",
      url: path,
      schema,
      handler,
    });
  }

  patch<T extends RouteGenericInterface>(
    path: string,
    schema: SchemaObject,
    handler: Handler<T>,
  ) {
    this.fastify.withTypeProvider<ZodTypeProvider>().route({
      method: "PATCH",
      url: path,
      schema,
      handler,
    });
  }

  delete<T extends RouteGenericInterface>(
    path: string,
    schema: SchemaObject,
    handler: Handler<T>,
  ) {
    this.fastify.withTypeProvider<ZodTypeProvider>().route({
      method: "DELETE",
      url: path,
      schema,
      handler,
    });
  }
}
