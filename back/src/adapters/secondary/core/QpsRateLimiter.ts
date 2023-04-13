import {
  addMilliseconds,
  differenceInMilliseconds,
  max,
  secondsToMilliseconds,
} from "date-fns";

import { SleepFn } from "shared";

import { RateLimiter } from "../../../domain/core/ports/RateLimiter";
import { TimeGateway } from "../../../domain/core/ports/TimeGateway";

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
  timeGateway: TimeGateway,
  sleepFn: SleepFn,
  cb: (arg: Input) => Promise<Output>,
): ((arg: Input) => Promise<Output>) => {
  const limiter = new QpsRateLimiter(maxQps, timeGateway, sleepFn);
  return async (arg: Input) => limiter.whenReady(() => cb(arg));
};

export class QpsRateLimiter implements RateLimiter {
  private readonly minMillisBetweenRequests;
  private nextRequestTime = new Date(0);

  public constructor(
    qps: number,
    private readonly timeGateway: TimeGateway,
    private readonly sleepFn: SleepFn,
  ) {
    this.minMillisBetweenRequests = secondsToMilliseconds(1 / qps);
  }

  public async whenReady<T>(cb: () => Promise<T>): Promise<T> {
    const now = this.timeGateway.now();

    const myRequestTime = max([this.nextRequestTime, now]);
    this.nextRequestTime = addMilliseconds(
      myRequestTime,
      this.minMillisBetweenRequests,
    );

    if (myRequestTime > now) {
      const sleepDurationMs = differenceInMilliseconds(myRequestTime, now);
      await this.sleepFn(sleepDurationMs);
    }

    return cb();
  }
}
