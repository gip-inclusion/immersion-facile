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
  const mappedErrorProperties = Object.getOwnPropertyNames(error)
    .sort()
    .map((property: string) => {
      return `${property}: ${error[property as keyof T]}`;
    })
    .join("\n\n");

  notifyDiscord(`\`\`\`${mappedErrorProperties}\`\`\``);
};
