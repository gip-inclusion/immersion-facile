import axios from "axios";
import { AppConfig } from "../adapters/primary/appConfig";

const discordSizeLimit = 1992;

type DiscordOptions = { skipCodeFormatting: boolean };

export const notifyDiscord = (
  content: string,
  options: DiscordOptions = { skipCodeFormatting: false },
) => {
  const discordWebhookUrl: string | undefined =
    AppConfig.createFromEnv()?.discordWebhookUrl;

  if (!discordWebhookUrl) return;

  if (content.length > discordSizeLimit)
    throw new Error("Content string too long to send by notification!");

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

export const notifyErrorDiscord = <T extends Error>(error: T) => {
  notifyDiscord(toPropertiesAsString(error));
};

export const notifyAndThrowErrorDiscord = <T extends Error>(error: T) => {
  notifyDiscord(toPropertiesAsString(error));
  throw error;
};

const toPropertiesAsString = <T>(obj: T): string =>
  Object.getOwnPropertyNames(obj)
    .sort()
    .map((property: string) => {
      return `${property}: ${obj[property as keyof T]}`;
    })
    .join("\n\n");
