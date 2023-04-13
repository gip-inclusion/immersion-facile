import { CustomTimeGateway } from "./TimeGateway/CustomTimeGateway";
import { QpsRateLimiter } from "./QpsRateLimiter";

describe("QpsRateLimiter", () => {
  let fakeClock: CustomTimeGateway;
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
    fakeClock = new CustomTimeGateway(new Date(1000000));
    mockSleep = jest.fn();
    mockCallback = jest.fn();

    // 10 QPS <=> duration between requests >= 100ms
    rateLimiter = new QpsRateLimiter(10, fakeClock, mockSleep);
  });

  it("no rate limit for duration = 100ms", async () => {
    await rateLimiter.whenReady(mockCallback);
    expectNotThrottled();

    fakeClock.advanceByMs(100);
    await rateLimiter.whenReady(mockCallback);
    expectNotThrottled();
  });

  it("no rate limit for duration > 100ms", async () => {
    await rateLimiter.whenReady(mockCallback);
    expectNotThrottled();

    fakeClock.advanceByMs(101);
    await rateLimiter.whenReady(mockCallback);
    expectNotThrottled();
  });

  it("rate limit for duration < 100ms", async () => {
    await rateLimiter.whenReady(mockCallback);
    expectNotThrottled();

    fakeClock.advanceByMs(99);
    await rateLimiter.whenReady(mockCallback);
    expectThrottledByMs(1);
  });
});
