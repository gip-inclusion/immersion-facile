import { CustomClock } from "../../adapters/secondary/core/ClockImplementations";
import { QpsRateLimiter } from "./../../adapters/secondary/core/QpsRateLimiter";

describe("QpsRateLimiter", () => {
  let fakeClock: CustomClock;
  let mockSleep: jest.Mock;
  let mockCallback: jest.Mock;
  let rateLimiter: QpsRateLimiter;

  const expectNotThrottled = () => {
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockSleep).not.toHaveBeenCalled();
    resetMocks();
  };

  const expectThrottledByMs = (ms: number) => {
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockSleep).toHaveBeenCalledWith(ms);
    resetMocks();
  };

  const resetMocks = () => {
    mockSleep.mockReset();
    mockCallback.mockReset();
  };

  beforeEach(() => {
    fakeClock = new CustomClock(new Date(1000000));
    mockSleep = jest.fn();
    mockCallback = jest.fn();

    // 10 QPS <=> duration between requests >= 100ms
    rateLimiter = new QpsRateLimiter(10, fakeClock, mockSleep);
  });

  test("no rate limit for duration = 100ms", async () => {
    await rateLimiter.whenReady(mockCallback);
    expectNotThrottled();

    fakeClock.advanceByMs(100);
    await rateLimiter.whenReady(mockCallback);
    expectNotThrottled();
  });

  test("no rate limit for duration > 100ms", async () => {
    await rateLimiter.whenReady(mockCallback);
    expectNotThrottled();

    fakeClock.advanceByMs(101);
    await rateLimiter.whenReady(mockCallback);
    expectNotThrottled();
  });

  test("rate limit for duration < 100ms", async () => {
    await rateLimiter.whenReady(mockCallback);
    expectNotThrottled();

    fakeClock.advanceByMs(99);
    await rateLimiter.whenReady(mockCallback);
    expectThrottledByMs(1);
  });
});
