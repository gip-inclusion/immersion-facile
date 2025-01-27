import axios from "axios";
import { Environment } from "shared";
import { AppConfig } from "../config/bootstrap/appConfig";
import { createLogger } from "./logger";

const logger = createLogger(__filename);

const discordSizeLimit = 1950;

export const notifyTeam = async (rawContent: string) => {
  await notifyDiscord(rawContent);
  await notifySlack(rawContent);
};

const notifyDiscord = async (rawContent: string) => {
  const config = AppConfig.createFromEnv();
  const discordWebhookUrl = config.discordWebhookUrl;

  if (!discordWebhookUrl) return Promise.resolve();

  const content = rawContent.slice(0, discordSizeLimit);

  return axios
    .post(
      discordWebhookUrl,
      {
        username: `${config.envType} - ${config.immersionFacileBaseUrl}`,
        content: formatCode(content),
      },
      {
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
        },
      },
    )
    .catch((error) => {
      logger.error({
        message: `An error occurred when trying to send notification to discord : ${error.message}`,
      });
      logger.error(error);
    });
};

const notifySlack = async (rawContent: string) => {
  const config = AppConfig.createFromEnv();
  const slackBotToken = config.slackBotToken;

  if (!slackBotToken) return Promise.resolve();

  return axios
    .post(
      "https://slack.com/api/chat.postMessage",
      {
        channel: getSlackChannelName(config.envType),
        text: formatCode(rawContent),
      },
      {
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          Authorization: `Bearer ${slackBotToken}`,
        },
      },
    )
    .catch((error) => {
      logger.error({
        message: `An error occurred when trying to send notification to Slack : ${error.message}`,
      });
      logger.error(error);
    });
};

const getSlackChannelName = (envType: Environment) => {
  switch (envType) {
    case "production":
      return "#if-prod-errors";
    case "staging":
      return "#if-staging-errors";
    case "pentest":
      return "#if-pentest-errors";
    default:
      throw Error(`Slack channel not defined for environment ${envType}`);
  }
};

const formatCode = (content: string) => `\`\`\`${content}\`\`\``;

export const notifyObjectToTeam = <T>(obj: T) => {
  notifyTeam(toPropertiesAsString(obj));
};

export const notifyToTeamAndThrowError = <T extends Error>(error: T) => {
  notifyTeam(toPropertiesAsString(error));
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
