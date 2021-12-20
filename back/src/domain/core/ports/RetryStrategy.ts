export interface RetryStrategy {
  apply: <T>(cb: () => Promise<T>) => Promise<T>;
}

export const noRetries: RetryStrategy = {
  apply: (cb) => cb(),
};
