import { ExponentialBackoffRetryStrategy } from "../../adapters/secondary/core/ExponentialBackoffRetryStrategy";
import { RetriableError } from "../../domain/core/ports/RetryStrategy";
import { expectPromiseToFailWithError } from "../../_testBuilders/test.helpers";

const dummyCallbackResult = { some: "value" };
const throwRetriableError = () => {
  throw new RetriableError(new Error("429: Too many requests"));
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

  test("no retry on callback success", async () => {
    mockCallback.mockResolvedValueOnce(dummyCallbackResult);
    const result = await retryStrategy.apply(mockCallback);

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(result).toEqual(dummyCallbackResult);

    expect(mockSleep).not.toHaveBeenCalled();
  });

  test("no retry of non-retriable error", async () => {
    const nonRetriableError = new Error("404: Not found");
    mockCallback.mockImplementationOnce(() => {
      throw nonRetriableError;
    });

    await expectPromiseToFailWithError(
      retryStrategy.apply(mockCallback),
      nonRetriableError,
    );

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockSleep).not.toHaveBeenCalled();
  });

  test("exponential backoff on retriable errors", async () => {
    mockCallback
      .mockImplementationOnce(throwRetriableError)
      .mockImplementationOnce(throwRetriableError)
      .mockImplementationOnce(throwRetriableError)
      .mockImplementationOnce(throwRetriableError)
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

  test("exponential backoff period is truncated at maxbackoffPeriodMs", async () => {
    mockRandom.mockReturnValue(0);
    mockCallback
      .mockImplementationOnce(throwRetriableError)
      .mockImplementationOnce(throwRetriableError) // 1. backoff: 1000ms
      .mockImplementationOnce(throwRetriableError) // 2. backoff: 2000ms
      .mockImplementationOnce(throwRetriableError) // 3. backoff: 4000ms
      .mockImplementationOnce(throwRetriableError) // 4. backoff: 8000ms
      .mockImplementationOnce(throwRetriableError) // 5. backoff: 16000ms
      .mockImplementationOnce(throwRetriableError) // 6. backoff: 32000ms
      .mockResolvedValue(dummyCallbackResult); // 7. backoff: 64000ms

    await retryStrategy.apply(mockCallback);

    expect(mockSleep).toHaveBeenNthCalledWith(5, maxBackoffPeriodMs);
    expect(mockSleep).toHaveBeenNthCalledWith(6, maxBackoffPeriodMs);
    expect(mockSleep).toHaveBeenNthCalledWith(7, maxBackoffPeriodMs);
  });

  test("aborts after timeout exceeded", async () => {
    const retriableError = new RetriableError(
      new Error("429: Too many requests"),
    );
    mockCallback.mockImplementation(() => {
      throw retriableError;
    });
    mockRandom.mockReturnValue(0);

    mockNow
      .mockReturnValueOnce(0) // start time
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(10_000)
      .mockReturnValueOnce(100_000); // timeout exceeded

    await expectPromiseToFailWithError(
      retryStrategy.apply(mockCallback),
      retriableError.cause,
    );

    expect(mockCallback).toHaveBeenCalledTimes(3);
  });
});
