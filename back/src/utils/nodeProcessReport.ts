import { cpus } from "os";
import { Logger } from "pino";
import { cpuUsage, memoryUsage } from "process";
import { TimeGateway } from "../domain/core/ports/TimeGateway";

export const startSamplingEventLoopLag = (
  eventLoopLagSamples: number[],
  maxSampleSize: number,
) => {
  const measureLag = () => {
    const start = process.hrtime();
    setImmediate(() => {
      if (eventLoopLagSamples.length < maxSampleSize) {
        const end = process.hrtime(start);
        const deltaMs = end[0] * 1e3 + end[1] / 1e6;
        eventLoopLagSamples.push(deltaMs);
      }
      measureLag();
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
  previousCpuUsage: NodeJS.CpuUsage = cpuUsage(),
  previousTime: Date = timeGateway.now(),
) =>
  setTimeout(() => {
    const currentTime = timeGateway.now();
    const currentCpuUsage = cpuUsage(previousCpuUsage);
    logger.info(
      makeReport(
        currentCpuUsage,
        (currentTime.getTime() - previousTime.getTime()) * 10 * cpus().length,
        eventLoopLagSamples.reduce((acc, val) => acc + val, 0) /
          eventLoopLagSamples.length,
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
      currentCpuUsage,
      currentTime,
    );
  }, intervalMs);

const makeReport = (
  { system, user }: NodeJS.CpuUsage,
  deltaTime: number,
  eventLoopMeanLagMs: number,
) => ({
  eventLoopMeanLagMs: eventLoopMeanLagMs.toFixed(5),
  cpuUsage: {
    system: system / deltaTime,
    total: (system + user) / deltaTime,
    user: user / deltaTime,
  },
  memoryUsage: memoryUsage(),
});
