import type { captureCheckIn } from "@sentry/node";
import { calculateDurationInSecondsFrom, pipeWithValue, slugify } from "shared";
import type { AppConfig } from "../config/bootstrap/appConfig";
import { type OpacifiedLogger, createLogger } from "../utils/logger";
import { getSlackChannelName, notifyTeam } from "../utils/notifyTeam";
import { configureSentry } from "./configureSentry";

const camelToKebab = (str: string) =>
  str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z])(?=[a-z])/g, "$1-$2")
    .toLowerCase();

type MonitorConfig = NonNullable<Parameters<typeof captureCheckIn>[1]>;
const defaultMonitorConfig: MonitorConfig = {
  schedule: { type: "interval", unit: "day", value: 1 },
  timezone: "Europe/Paris",
  checkinMargin: 120,
  maxRuntime: 30,
};

export const handleCRONScript = async <
  T extends Record<string, unknown> | void,
>(
  name: string,
  config: AppConfig,
  script: () => Promise<T>,
  handleResults: (results: T) => string,
  logger: OpacifiedLogger = createLogger(__filename),
  monitorConfig: MonitorConfig = defaultMonitorConfig,
) => {
  const sanitizedName = pipeWithValue(name, camelToKebab, slugify);
  const sentry = configureSentry(config.envType);

  try {
    const startTime = Date.now();
    const checkInId = sentry
      ? sentry.captureCheckIn(
          {
            monitorSlug: sanitizedName,
            status: "in_progress",
          },
          { ...defaultMonitorConfig, ...monitorConfig },
        )
      : undefined;

    const context = `${config.envType} - ${config.immersionFacileBaseUrl}`;
    const contextParams: ScriptContextParams = {
      context,
      logger,
      name,
      start: new Date(),
    };

    try {
      const results = await script();
      if (sentry) {
        sentry.captureCheckIn({
          checkInId,
          monitorSlug: sanitizedName,
          status: "ok",
          duration: (Date.now() - startTime) / 1000,
        });
      }
      await onScriptSuccess<T>({ ...contextParams, handleResults })(results);
    } catch (error) {
      if (sentry) {
        sentry.captureCheckIn({
          checkInId,
          monitorSlug: sanitizedName,
          status: "error",
          duration: (Date.now() - startTime) / 1000,
        });
      }
      await onScriptError({
        ...contextParams,
        slackErrorChannelName: getSlackChannelName(config.envType, true),
      })(error);
    }
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    process.exit(0);
  }
};

type ScriptContextParams = {
  start: Date;
  context: string;
  logger: OpacifiedLogger;
  name: string;
};

const onScriptSuccess =
  <T extends Record<string, unknown> | void>({
    start,
    context,
    logger,
    name,
    handleResults,
  }: ScriptContextParams & {
    handleResults: (results: T) => string;
  }) =>
  async (results: T): Promise<void> => {
    const durationInSeconds = calculateDurationInSecondsFrom(start);
    const reportTitle = `✅ Success at ${new Date().toISOString()} - ${context}`;
    const reportContent = handleResults({ ...results, durationInSeconds });

    logger.info({
      message: `${name} - ${reportTitle}`,
      reportContent,
      durationInSeconds,
    });
    const report = [
      reportTitle,
      `Script [${name}]`,
      `Script duration : ${durationInSeconds} seconds`,
      "-> Report content :",
      reportContent,
      "----------------------------------------",
    ].join("\n");

    await notifyTeam({ rawContent: report, isError: false });
  };

const onScriptError =
  ({
    start,
    context,
    logger,
    name,
    slackErrorChannelName,
  }: ScriptContextParams & { slackErrorChannelName: string }) =>
  async (error: any): Promise<void> => {
    const durationInSeconds = calculateDurationInSecondsFrom(start);
    const reportTitle = `❌ Failure at ${new Date().toISOString()} - ${context} - ${
      error.message
    }`;

    logger.error({
      durationInSeconds,
      message: `${name} - ${reportTitle}`,
      error,
    });
    const report = [
      reportTitle,
      `Script [${name}]`,
      `Script duration : ${durationInSeconds} seconds`,
      `Error message :${error.message}`,
      "----------------------------------------",
    ].join("\n");

    await notifyTeam({ rawContent: report, isError: true });
    await notifyTeam({
      rawContent: [
        reportTitle,
        `Script [${name}]`,
        `See error channel ${slackErrorChannelName} for more details`,
      ].join("\n"),
      isError: false,
    });
  };
