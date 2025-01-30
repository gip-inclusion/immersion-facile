import axios from "axios";
import { Environment } from "shared";
import { AppConfig } from "../config/bootstrap/appConfig";
import { createLogger } from "./logger";

const logger = createLogger(__filename);

const discordSizeLimit = 1950;

export const notifyTeam = async ({
  rawContent,
  isError,
}: { rawContent: string; isError: boolean }) => {
  await notifyDiscord(rawContent);
  await notifySlack(rawContent, isError);
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

const notifySlack = async (rawContent: string, isError: boolean) => {
  const config = AppConfig.createFromEnv();
  const slackBotToken = config.slackBotToken;

  if (!slackBotToken) return Promise.resolve();

  return axios
    .post(
      "https://slack.com/api/chat.postMessage",
      {
        channel: getSlackChannelName(config.envType, isError),
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

const getSlackChannelName = (envType: Environment, isError: boolean) => {
  switch (envType) {
    case "production":
      return isError ? "#if-prod-errors" : "#if-prod-notifications";
    case "staging":
      return isError ? "#if-staging-errors" : "#if-staging-notifications";
    case "pentest":
      return isError ? "#if-pentest-errors" : "#if-pentest-notifications";
    default:
      throw Error(`Slack channel not defined for environment ${envType}`);
  }
};

const formatCode = (content: string) => `\`\`\`${content}\`\`\``;

export const notifyErrorObjectToTeam = <T>(obj: T) => {
  notifyTeam({
    rawContent: toPropertiesAsString(obj),
    isError: true,
  });
};

export const notifyToTeamAndThrowError = <T extends Error>(error: T) => {
  notifyTeam({
    rawContent: toPropertiesAsString(error),
    isError: true,
  });
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
