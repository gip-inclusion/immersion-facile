import {
  addMilliseconds,
  differenceInMilliseconds,
  secondsToMilliseconds,
} from "date-fns";
import { Clock } from "../../../domain/core/ports/Clock";
import { RateLimiter } from "../../../domain/core/ports/RateLimiter";
import { sleep, SleepFn } from "../../../shared/utils";
import { RealClock } from "./ClockImplementations";

// Simple rate limiter that limits the output to the specified queries per second (QPS) rate.
//
// Usage examples:
//
// // Option 1: Explicit rate limiter.
// const limiter: RateLimiter = new QpsRateLimiter(0.5, new RealClock(), sleep); // max 1 request every 2 seconds
// await limiter.whenReady((arg) => performRequest(arg));
//
// // Option 2: Using the withQpsLimit helper.
// const myRateLimitedFunction = withQpsLimit(0.5, new RealClock(), sleep, performRequest);
// myRateLimitedFunction(arg);
export const withQpsLimit = <Input, Output>(
  maxQps: number,
  clock: Clock,
  sleepFn: SleepFn,
  cb: (arg: Input) => Promise<Output>,
): ((arg: Input) => Promise<Output>) => {
  const limiter = new QpsRateLimiter(maxQps, clock, sleepFn);
  return async (arg: Input) => await limiter.whenReady(() => cb(arg));
};

export class QpsRateLimiter implements RateLimiter {
  private readonly minMillisBetweenRequests;
  private lastRequestTime = new Date(0);

  public constructor(
    qps: number,
    private readonly clock: Clock,
    private readonly sleepFn: SleepFn,
  ) {
    this.minMillisBetweenRequests = secondsToMilliseconds(1 / qps);
  }

  public async whenReady<T>(cb: () => Promise<T>): Promise<T> {
    const sleepDurationMs = this.millisUntilReady();
    if (sleepDurationMs > 0) await this.sleepFn(sleepDurationMs);
    this.recordRequest();
    return cb();
  }

  private millisUntilReady() {
    const nextRequestTime = addMilliseconds(
      this.lastRequestTime,
      this.minMillisBetweenRequests,
    );
    return Math.max(
      0,
      differenceInMilliseconds(nextRequestTime, this.clock.now()),
    );
  }

  private recordRequest() {
    this.lastRequestTime = this.clock.now();
  }
}
