import { ManagedRedirectErrorKinds } from "shared/src/errors/managedErrors";

export abstract class RedirectError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, { cause });
  }
}

export class ManagedRedirectError extends RedirectError {
  constructor(public readonly kind: ManagedRedirectErrorKinds, cause?: Error) {
    super(`A managed redirect error of type ${kind} has been thrown`, cause);
  }
}

export class RawRedirectError extends RedirectError {
  constructor(
    public readonly title: string,
    public override readonly message: string,
    cause?: Error,
  ) {
    super(`A raw redirect error has been thrown : ${title} ${message}`, cause);
  }
}
