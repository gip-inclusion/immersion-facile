import axios from "axios";
import { Logger } from "pino";
import { createLogger } from "../../../utils/logger";
import { AppConfig } from "../config/appConfig";

export const handleEndOfScriptNotification = async <T>(
  name: string,
  script: () => Promise<T>,
  handleResults: (results: T) => string,
  logger: Logger = createLogger(__filename),
) => {
  const start = new Date();
  return script()
    .then((results) => {
      const end = new Date();
      const durationInSeconds = (end.getTime() - start.getTime()) / 1000;

      const reportTitle = `Script [${name}] finished successfully at ${end.toISOString()}`;
      const reportContent = handleResults({ ...results, durationInSeconds });

      logger.info({ reportContent, durationInSeconds }, reportTitle);

      const report = [
        reportTitle,
        `Script duration : ${durationInSeconds} seconds`,
        "\n-> Report content :",
        reportContent,
      ].join("\n");

      return notifyDiscordPipelineReport(report).finally(() => process.exit(0));
    })
    .catch((error) => {
      const end = new Date();
      const durationInSeconds = (end.getTime() - start.getTime()) / 1000;
      const reportTitle = `Script [${name}] failed with error at ${end.toISOString()}`;

      logger.error({ error, durationInSeconds }, reportTitle);
      return notifyDiscordPipelineReport(
        [
          reportTitle,
          `Duration : ${durationInSeconds} seconds`,
          `Error message :${error.message}`,
        ].join("\n"),
      ).finally(() => process.exit(1));
    });
};

const discordSizeLimit = 1950;
const notifyDiscordPipelineReport = async (rawContent: string) => {
  const discordPipelineReportsWebhookUrl: string | undefined =
    AppConfig.createFromEnv()?.discordPipelineReportsWebhookUrl;

  if (!discordPipelineReportsWebhookUrl) return;

  const content = rawContent.slice(0, discordSizeLimit);

  // This is intentionaly not awaited following a fire and forget logic.
  //eslint-disable-next-line @typescript-eslint/no-floating-promises
  await axios.post(
    discordPipelineReportsWebhookUrl,
    {
      username: "Immersion Facile Bot",
      content,
    },
    {
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
      },
    },
  );
};
