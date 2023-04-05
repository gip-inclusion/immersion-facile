import axios from "axios";
import { AppConfig } from "../adapters/primary/config/appConfig";
import { createLogger } from "./logger";

const logger = createLogger(__filename);

const discordSizeLimit = 1950;

type DiscordOptions = { skipCodeFormatting: boolean };

export const notifyDiscord = (
  rawContent: string,
  options: DiscordOptions = { skipCodeFormatting: false },
) => {
  const config = AppConfig.createFromEnv();
  const discordWebhookUrl = config.discordWebhookUrl;

  if (!discordWebhookUrl) return;

  const content = rawContent.slice(0, discordSizeLimit);

  // This is intentionaly not awaited following a fire and forget logic.
  //eslint-disable-next-line @typescript-eslint/no-floating-promises
  axios
    .post(
      discordWebhookUrl,
      {
        username: `${config.envType} - ${config.immersionFacileBaseUrl}`,
        content: options.skipCodeFormatting ? content : format(content),
      },
      {
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
        },
      },
    )
    .catch((error) => {
      logger.error(
        `An error occurred when trying to send notification to discord : ${error.message}`,
      );
      logger.error(error);
    });
};

const format = (content: string) => `\`\`\`${content}\`\`\``;

export const notifyObjectDiscord = <T>(obj: T) => {
  notifyDiscord(toPropertiesAsString(obj));
};

export const notifyAndThrowErrorDiscord = <T extends Error>(error: T) => {
  notifyDiscord(toPropertiesAsString(error));
  throw error;
};

const toPropertiesAsString = <T>(obj: T): string =>
  Object.getOwnPropertyNames(obj)
    .sort()
    .map(
      (property: string) =>
        `${property}: ${JSON.stringify(obj[property as keyof T], null, 2)}`,
    )
    .join("\n");
