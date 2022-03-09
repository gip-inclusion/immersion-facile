import axios from "axios";
import { AppConfig } from "../adapters/primary/appConfig";

const discordSizeLimit = 1999;

export const notifyDiscord = (content: string) => {
  const discordWebhookUrl: string | undefined =
    AppConfig.createFromEnv()?.discordWebhookUrl;

  if (!discordWebhookUrl) return;

  if (content.length > discordSizeLimit)
    throw new Error("Content string too long to send by notification!");

  axios.post(
    discordWebhookUrl,
    {
      username: "Immersion Facile Bot",
      content: content,
    },
    {
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
      },
    },
  );
};

export const notifyErrorDiscord = <T extends Error>(error: T) => {
  notifyDiscord(`\`\`\`${toMappedErrorPropertiesString(error)}\`\`\``);
};

export const notifyAndThrowErrorDiscord = <T extends Error>(error: T) => {
  notifyDiscord(`\`\`\`${toMappedErrorPropertiesString(error)}\`\`\``);
  throw error;
};

const toMappedErrorPropertiesString = <T extends Error>(error: T): string =>
  Object.getOwnPropertyNames(error)
    .sort()
    .map((property: string) => {
      return `${property}: ${error[property as keyof T]}`;
    })
    .join("\n\n");
