import axios from "axios";
import { calculateDurationInSecondsFrom } from "shared";
import { AppConfig } from "../config/bootstrap/appConfig";
import { OpacifiedLogger, createLogger } from "../utils/logger";

export const handleEndOfScriptNotification = async <
  T extends Record<string, unknown> | void,
>(
  name: string,
  config: AppConfig,
  script: () => Promise<T>,
  handleResults: (results: T) => string,
  logger: OpacifiedLogger = createLogger(__filename),
) => {
  const context = `${config.envType} - ${config.immersionFacileBaseUrl}`;

  const contextParams: ScriptContextParams = {
    context,
    logger,
    name,
    start: new Date(),
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
  (results: T): Promise<void> => {
    const durationInSeconds = calculateDurationInSecondsFrom(start);
    const reportTitle = `✅ Success at ${new Date().toISOString()} - ${context}`;
    const reportContent = handleResults({ ...results, durationInSeconds });

    logger.info({ message: reportTitle, reportContent, durationInSeconds });
    const report = [
      reportTitle,
      `Script [${name}]`,
      `Script duration : ${durationInSeconds} seconds`,
      "-> Report content :",
      reportContent,
      "----------------------------------------",
    ].join("\n");
    return notifyDiscordPipelineReport(report).finally(() => process.exit(0));
  };

const onScriptError =
  ({ start, context, logger, name }: ScriptContextParams) =>
  (error: any): Promise<void> => {
    const durationInSeconds = calculateDurationInSecondsFrom(start);
    const reportTitle = `❌ Failure at ${new Date().toISOString()} - ${context} - ${
      error.message
    }`;

    logger.error({ durationInSeconds, message: reportTitle, error });
    const report = [
      reportTitle,
      `Script [${name}]`,
      `Script duration : ${durationInSeconds} seconds`,
      `Error message :${error.message}`,
      "----------------------------------------",
    ].join("\n");
    return notifyDiscordPipelineReport(report).finally(() => process.exit(1));
  };

const discordSizeLimit = 1950;
const notifyDiscordPipelineReport = async (rawContent: string) => {
  const config = AppConfig.createFromEnv();
  const discordPipelineReportsWebhookUrl: string | undefined =
    config.discordPipelineReportsWebhookUrl;

  if (!discordPipelineReportsWebhookUrl) return;

  const content = rawContent.slice(0, discordSizeLimit);

  // This is intentionaly not awaited following a fire and forget logic.
  //eslint-disable-next-line @typescript-eslint/no-floating-promises
  await axios.post(
    discordPipelineReportsWebhookUrl,
    {
      username: `${config.envType} - ${config.immersionFacileBaseUrl}`,
      content,
    },
    {
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
      },
    },
  );
};
