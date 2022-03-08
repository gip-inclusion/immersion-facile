import axios from "axios";
import { AppConfig } from "../adapters/primary/appConfig";

const discordSizeLimit = 2000;

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
