import { cpus } from "os";
import { Logger } from "pino";
import { cpuUsage, memoryUsage } from "process";
import { TimeGateway } from "../domain/core/ports/TimeGateway";

export const startSamplingEventLoopLag = (
  eventLoopLagSamples: number[],
  maxSampleSize: number,
  eventLoopSampleIntervalMs: number,
  logger: Logger,
) => {
  logger.info(
    `Start sampling event loop lag at a frequency of ${eventLoopSampleIntervalMs}ms.`,
  );
  const measureLag = () => {
    const start = process.hrtime();
    setImmediate(() => {
      if (eventLoopLagSamples.length < maxSampleSize) {
        const end = process.hrtime(start);
        const deltaMs = end[0] * 1e3 + end[1] / 1e6;
        eventLoopLagSamples.push(deltaMs);
      }
      setTimeout(measureLag, eventLoopSampleIntervalMs);
    });
  };
  measureLag();
};

export const startPeriodicNodeProcessReport = (
  intervalMs: number,
  timeGateway: TimeGateway,
  logger: Logger,
  eventLoopLagSamples: number[],
  maxSampleSize: number,
  previousTime: Date = timeGateway.now(),
) => {
  const previousCpuUsage = cpuUsage();

  return setTimeout(() => {
    const currentTime = timeGateway.now();
    const currentCpuUsage = cpuUsage(previousCpuUsage);

    logger.info(
      makeReport(
        currentCpuUsage,
        (currentTime.getTime() - previousTime.getTime()) * 1000 * cpus().length,
        makeEventLoopLagMeanMs(eventLoopLagSamples),
      ),
      "nodeRessourcesReport",
    );

    if (eventLoopLagSamples.length >= maxSampleSize)
      eventLoopLagSamples.length = 0;

    startPeriodicNodeProcessReport(
      intervalMs,
      timeGateway,
      logger,
      eventLoopLagSamples,
      maxSampleSize,
      currentTime,
    );
  }, intervalMs);
};

const makeReport = (
  { system, user }: NodeJS.CpuUsage,
  deltaTime: number,
  eventLoopMeanLagMs: number,
) => ({
  eventLoopMeanLagMs: eventLoopMeanLagMs.toFixed(5),
  cpuUsage: {
    system: (system / deltaTime) * 100,
    total: ((system + user) / deltaTime) * 100,
    user: (user / deltaTime) * 100,
  },
  memoryUsage: memoryUsage(),
});

const makeEventLoopLagMeanMs = (eventLoopLagSamples: number[]): number =>
  eventLoopLagSamples.length > 0
    ? eventLoopLagSamples.reduce((acc, val) => acc + val, 0) /
      eventLoopLagSamples.length
    : 0;
