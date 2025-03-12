import { calculateDurationInSecondsFrom } from "shared";
import type { AppConfig } from "../config/bootstrap/appConfig";
import { type OpacifiedLogger, createLogger } from "../utils/logger";
import { notifyTeam } from "../utils/notifyTeam";
import { type SentryInstance, configureSentry } from "./configureSentry";

export const handleCRONScript = async <
  T extends Record<string, unknown> | void,
>(
  name: string,
  config: AppConfig,
  script: () => Promise<T>,
  handleResults: (results: T) => string,
  logger: OpacifiedLogger = createLogger(__filename),
) => {
  const context = `${config.envType} - ${config.immersionFacileBaseUrl}`;

  const sentry = configureSentry(config);

  const sentryCheckInId = sentry.captureCheckIn({
    monitorSlug: name,
    status: "in_progress",
  });

  const contextParams: ScriptContextParams = {
    context,
    logger,
    name,
    start: new Date(),
    sentryCheckInId,
    sentry,
  };
  return script()
    .then(onScriptSuccess<T>({ ...contextParams, handleResults }))
    .catch(onScriptError(contextParams));
};

type ScriptContextParams = {
  start: Date;
  context: string;
  logger: OpacifiedLogger;
  name: string;
  sentryCheckInId: string;
  sentry: SentryInstance;
};

const onScriptSuccess =
  <T extends Record<string, unknown> | void>({
    start,
    context,
    logger,
    name,
    handleResults,
    sentryCheckInId,
    sentry,
  }: ScriptContextParams & {
    handleResults: (results: T) => string;
  }) =>
  (results: T): Promise<void> => {
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
    sentry.captureCheckIn({
      checkInId: sentryCheckInId,
      status: "ok",
      monitorSlug: name,
      duration: durationInSeconds,
    });

    return notifyTeam({ rawContent: report, isError: false }).finally(() =>
      process.exit(0),
    );
  };

const onScriptError =
  ({
    start,
    context,
    logger,
    name,
    sentryCheckInId,
    sentry,
  }: ScriptContextParams) =>
  (error: any): Promise<void> => {
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

    sentry.captureCheckIn({
      checkInId: sentryCheckInId,
      status: "error",
      monitorSlug: name,
      duration: durationInSeconds,
    });

    return notifyTeam({ rawContent: report, isError: false }).finally(() =>
      process.exit(0),
    );
  };
