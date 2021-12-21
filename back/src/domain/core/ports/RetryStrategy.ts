export class RetriableError extends Error {
  constructor(readonly cause: Error) {
    super();
    Object.setPrototypeOf(this, RetriableError.prototype);
  }
}

export interface RetryStrategy {
  apply: <T>(cb: () => Promise<T>) => Promise<T>;
}

export const noRetries: RetryStrategy = {
  apply: (cb) => {
    try {
      return cb();
    } catch (error: any) {
      throw error instanceof RetriableError ? error.cause : error;
    }
  },
};
