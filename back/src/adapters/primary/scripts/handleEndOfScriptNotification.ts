import axios from "axios";
import { Logger } from "pino";

import { createLogger } from "../../../utils/logger";
import { AppConfig } from "../config/appConfig";

export const handleEndOfScriptNotification = async <T>(
  name: string,
  config: AppConfig,
  script: () => Promise<T>,
  handleResults: (results: T) => string,
  logger: Logger = createLogger(__filename),
) => {
  const context = `${config.envType} - ${config.immersionFacileBaseUrl}\nScript [${name}]`;
  const start = new Date();
  return script()
    .then((results) => {
      const end = new Date();
      const durationInSeconds = (end.getTime() - start.getTime()) / 1000;

      const reportTitle = `✅Success at ${end.toISOString()} - ${context}`;
      const reportContent = handleResults({ ...results, durationInSeconds });

      logger.info({ reportContent, durationInSeconds }, reportTitle);

      const report = [
        reportTitle,
        `Script duration : ${durationInSeconds} seconds`,
        "-> Report content :",
        reportContent,
        "----------------------------------------",
      ].join("\n");

      return notifyDiscordPipelineReport(report).finally(() => process.exit(0));
    })
    .catch((error) => {
      const end = new Date();
      const durationInSeconds = (end.getTime() - start.getTime()) / 1000;
      const reportTitle = `❌Failure at ${end.toISOString()} - ${context}`;

      logger.error({ error, durationInSeconds }, reportTitle);
      return notifyDiscordPipelineReport(
        [
          reportTitle,
          `Duration : ${durationInSeconds} seconds`,
          `Error message :${error.message}`,
          "----------------------------------------",
        ].join("\n"),
      ).finally(() => process.exit(1));
    });
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
