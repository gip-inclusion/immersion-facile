import type Bottleneck from "bottleneck";
import { errors } from "shared";

export const scheduleWithBackpressure = <T>(
  limiter: Bottleneck,
  serviceName: string,
  fn: () => Promise<T>,
): Promise<T> =>
  limiter.schedule(fn).catch((error: Error) => {
    if (error.message === "This job has been dropped by Bottleneck")
      throw errors.partner.tooManyRequests({ serviceName });
    throw error;
  });
