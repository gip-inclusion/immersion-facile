import { z } from "zod";

export abstract class HttpError extends Error {
  abstract httpCode: number;

  constructor(message?: any) {
    super(message);
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export class UnauthorizedError extends HttpError {
  httpCode = 401;

  constructor() {
    super("Veuillez vous authentifier");
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

const makeForbiddenMessage = (reason?: string): string =>
  reason ? `Forbidden : ${reason}` : "Accès refusé";

export class ForbiddenError extends HttpError {
  httpCode = 403;

  constructor(reason?: string) {
    super(makeForbiddenMessage(reason));
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class FeatureDisabledError extends HttpError {
  httpCode = 424;

  constructor(disableService?: string) {
    super(disableService + " is disabled");
    Object.setPrototypeOf(this, FeatureDisabledError.prototype);
  }
}

export class NotFoundError extends HttpError {
  httpCode = 404;

  constructor(msg?: any) {
    super(msg);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class BadRequestError extends HttpError {
  httpCode = 400;

  constructor(msg?: any) {
    super(msg);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class ConflictError extends HttpError {
  httpCode = 409;
  constructor(msg: any) {
    super(msg);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class TooManyRequestApiError extends HttpError {
  httpCode = 429;

  constructor(public serviceName: string) {
    super(`Le service ${serviceName} a subit trop de solicitation`);
    Object.setPrototypeOf(this, TooManyRequestApiError.prototype);
  }
}

export class UnavailableApiError extends HttpError {
  httpCode = 503;

  constructor(public serviceName: string) {
    super(`Le service ${serviceName} n'est pas disponible`);
    Object.setPrototypeOf(this, UnavailableApiError.prototype);
  }
}

export const validateAndParseZodSchema = <T>(
  inputSchema: z.Schema<T>,
  params: any,
): T => {
  try {
    return inputSchema.parse(params);
  } catch (e) {
    throw new BadRequestError(e);
  }
};
