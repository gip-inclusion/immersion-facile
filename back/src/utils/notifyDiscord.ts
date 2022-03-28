import axios from "axios";
import { AppConfig } from "../adapters/primary/appConfig";

const discordSizeLimit = 1950;

type DiscordOptions = { skipCodeFormatting: boolean };

export const notifyDiscord = (
  rawContent: string,
  options: DiscordOptions = { skipCodeFormatting: false },
) => {
  const discordWebhookUrl: string | undefined =
    AppConfig.createFromEnv()?.discordWebhookUrl;

  if (!discordWebhookUrl) return;

  const content = rawContent.slice(0, discordSizeLimit);
  // This is intentionaly not awaited following a fire and forget logic.
  axios.post(
    discordWebhookUrl,
    {
      username: "Immersion Facile Bot",
      content: options.skipCodeFormatting ? content : format(content),
    },
    {
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
      },
    },
  );
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
    .map((property: string) => `${property}: ${obj[property as keyof T]}`)
    .join("\n");
