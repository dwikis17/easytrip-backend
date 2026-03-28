import { EventEmitter } from "node:events";
import type { RequestHandler } from "express";
import httpMocks from "node-mocks-http";

type ExecuteHandlersOptions = {
  handlers: RequestHandler[];
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
};

export async function executeHandlers(options: ExecuteHandlersOptions) {
  const req = httpMocks.createRequest({
    method: options.method,
    url: options.url,
    headers: options.headers,
  });
  const res = httpMocks.createResponse({ eventEmitter: EventEmitter });

  if (options.body !== undefined) {
    req.body = options.body;
  }

  return new Promise<{
    req: typeof req;
    res: typeof res;
    status: number;
    body: unknown;
  }>((resolve, reject) => {
    let settled = false;
    let index = 0;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      resolve({
        req,
        res,
        status: res.statusCode,
        body: res._isJSON() ? res._getJSONData() : res._getData(),
      });
    };

    const next = (error?: unknown) => {
      if (settled) {
        return;
      }

      if (error) {
        settled = true;
        reject(error);
        return;
      }

      const handler = options.handlers[index++];
      if (!handler) {
        finish();
        return;
      }

      Promise.resolve(handler(req, res, next)).catch((handlerError) => {
        settled = true;
        reject(handlerError);
      });
    };

    res.on("finish", finish);
    res.on("end", finish);

    next();
  });
}
