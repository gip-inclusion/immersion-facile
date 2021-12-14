export interface RateLimiter {
  whenReady: <T>(cb: () => Promise<T>) => Promise<T>;
}

export const unrestrictedRateLimiter = new (class implements RateLimiter {
  public whenReady<T>(cb: () => Promise<T>) {
    return cb();
  }
})();
