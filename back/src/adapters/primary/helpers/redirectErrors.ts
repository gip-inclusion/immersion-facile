import { ManagedRedirectErrorKinds } from "shared/src/errors/managedErrors";

export abstract class RedirectError extends Error {
  constructor(message?: any) {
    super(message);
  }
}

export class ManagedRedirectError extends RedirectError {
  constructor(public readonly kind: ManagedRedirectErrorKinds) {
    super(`A managed redirect error of type ${kind} has been thrown`);
  }
}

export class RawRedirectError extends RedirectError {
  constructor(
    public readonly title: string,
    public override readonly message: string,
  ) {
    super(`A raw redirect error has been thrown : ${title} ${message}`);
  }
}
