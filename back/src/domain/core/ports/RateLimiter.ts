export interface RateLimiter {
  whenReady: <T>(cb: () => Promise<T>) => Promise<T>;
}

export const noRateLimit: RateLimiter = {
  whenReady: (cb) => cb(),
};
