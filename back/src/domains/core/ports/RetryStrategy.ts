import { castError } from "shared";

export class RetryableError extends Error {
  constructor(public readonly initialError: Error) {
    super();
    Object.setPrototypeOf(this, RetryableError.prototype);
  }
}

export interface RetryStrategy {
  apply: <T>(cb: () => Promise<T>) => Promise<T>;
}

export const noRetries: RetryStrategy = {
  apply: (cb) => {
    try {
      return cb();
    } catch (err) {
      const error = castError(err);
      throw error instanceof RetryableError ? error.initialError : error;
    }
  },
};
