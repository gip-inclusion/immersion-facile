import { ExponentialBackoffRetryStrategy } from "./ExponentialBackoffRetryStrategy";
import { RetryableError } from "../../../domain/core/ports/RetryStrategy";
import { expectPromiseToFailWithError } from "shared";

const dummyCallbackResult = { some: "value" };
const throwRetryableError = () => {
  throw new RetryableError(new Error("429: Too many requests"));
};
const maxBackoffPeriodMs = 10_000;
const deadlineMs = 100_000;

describe("ExponentialBackoffRetryStrategy", () => {
  let mockNow: jest.Mock;
  let mockNowNumber: jest.Mock;
  let mockSleep: jest.Mock;
  let mockRandom: jest.Mock;
  let mockCallback: jest.Mock;

  let retryStrategy: ExponentialBackoffRetryStrategy;

  beforeEach(() => {
    mockNow = jest.fn();
    mockNowNumber = jest.fn();
    mockSleep = jest.fn();
    mockRandom = jest.fn();
    mockCallback = jest.fn();

    retryStrategy = new ExponentialBackoffRetryStrategy(
      maxBackoffPeriodMs,
      deadlineMs,
      { now: mockNow, timestamp: mockNowNumber },
      mockSleep,
      mockRandom,
    );
  });

  it("no retry on callback success", async () => {
    mockCallback.mockResolvedValueOnce(dummyCallbackResult);
    const result = await retryStrategy.apply(mockCallback);

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(result).toEqual(dummyCallbackResult);

    expect(mockSleep).not.toHaveBeenCalled();
  });

  it("no retry of non-retryable error", async () => {
    const nonRetryableError = new Error("404: Not found");
    mockCallback.mockImplementationOnce(() => {
      throw nonRetryableError;
    });

    await expectPromiseToFailWithError(
      retryStrategy.apply(mockCallback),
      nonRetryableError,
    );

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockSleep).not.toHaveBeenCalled();
  });

  it("exponential backoff on retryable errors", async () => {
    mockCallback
      .mockImplementationOnce(throwRetryableError)
      .mockImplementationOnce(throwRetryableError)
      .mockImplementationOnce(throwRetryableError)
      .mockImplementationOnce(throwRetryableError)
      .mockResolvedValueOnce(dummyCallbackResult);

    mockRandom
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(2)
      .mockReturnValueOnce(4)
      .mockReturnValueOnce(8);

    const result = await retryStrategy.apply(mockCallback);

    expect(mockCallback).toHaveBeenCalledTimes(5);
    expect(result).toEqual(dummyCallbackResult);

    expect(mockSleep).toHaveBeenNthCalledWith(1, 1001);
    expect(mockSleep).toHaveBeenNthCalledWith(2, 2002);
    expect(mockSleep).toHaveBeenNthCalledWith(3, 4004);
    expect(mockSleep).toHaveBeenNthCalledWith(4, 8008);
  });

  it("exponential backoff period is truncated at maxbackoffPeriodMs", async () => {
    mockRandom.mockReturnValue(0);
    mockCallback
      .mockImplementationOnce(throwRetryableError)
      .mockImplementationOnce(throwRetryableError) // 1. backoff: 1000ms
      .mockImplementationOnce(throwRetryableError) // 2. backoff: 2000ms
      .mockImplementationOnce(throwRetryableError) // 3. backoff: 4000ms
      .mockImplementationOnce(throwRetryableError) // 4. backoff: 8000ms
      .mockImplementationOnce(throwRetryableError) // 5. backoff: 16000ms
      .mockImplementationOnce(throwRetryableError) // 6. backoff: 32000ms
      .mockResolvedValue(dummyCallbackResult); // 7. backoff: 64000ms

    await retryStrategy.apply(mockCallback);

    expect(mockSleep).toHaveBeenNthCalledWith(5, maxBackoffPeriodMs);
    expect(mockSleep).toHaveBeenNthCalledWith(6, maxBackoffPeriodMs);
    expect(mockSleep).toHaveBeenNthCalledWith(7, maxBackoffPeriodMs);
  });

  it("aborts after timeout exceeded", async () => {
    const retryableError = new RetryableError(
      new Error("429: Too many requests"),
    );
    mockCallback.mockImplementation(() => {
      throw retryableError;
    });
    mockRandom.mockReturnValue(0);

    mockNow
      .mockReturnValueOnce(0) // start time
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(10_000)
      .mockReturnValueOnce(100_000); // timeout exceeded

    await expectPromiseToFailWithError(
      retryStrategy.apply(mockCallback),
      retryableError.initialError,
    );

    expect(mockCallback).toHaveBeenCalledTimes(3);
  });
});
