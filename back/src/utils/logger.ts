import path from "path";
import { AxiosError } from "axios";
import { Request } from "express";
import { QueryResult } from "kysely";
import pino, { Logger } from "pino";
import { AgencyId, ConventionId, PeExternalId } from "shared";
import { HttpResponse } from "shared-routes";
import { AuthorisationStatus } from "../config/bootstrap/authMiddleware";
import { SubscriberResponse } from "../domains/core/api-consumer/ports/SubscribersGateway";
import { TypeOfEvent } from "../domains/core/events/adapters/EventCrawlerImplementations";
import { DomainEvent, DomainTopic } from "../domains/core/events/events";
import { SearchMadeEntity } from "../domains/establishment/entities/SearchMadeEntity";
import { LaBonneBoiteRequestParams } from "../domains/establishment/ports/LaBonneBoiteGateway";
import { PartialResponse } from "./axiosUtils";
import { NodeProcessReport } from "./nodeProcessReport";

const getLogLevel = () => {
  // Allow command-line overrides of the log level.
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
  // Avoid distracting log output during test execution.
  // if (process.env.NODE_ENV === "test") return "fatal";
  // Default to level "info"
  return "info";
};

const devTransport = {
  target: "pino-pretty",
  options: {
    colorize: true,
    singleLine: !process.env.LOGGER_MULTI_LINE,
    translateTime: "yyyy-mm-dd HH:MM:ss.l Z",
    ignore: "pid,hostname",
  },
};

const rootLogger = pino({
  level: getLogLevel(),
  // TODO : for testing
  transport: devTransport,
  // ...(process.env.NODE_ENV !== "production" ? { transport: devTransport } : {}),
});

// Example use: const logger = createLogger(__filename);
export const legacyCreateLogger = (filename: string): Logger => {
  return rootLogger.child({ name: path.basename(filename) });
};

type SQLError = {
  query: string;
  result: QueryResult<any>;
  error: Error;
};

type LoggerParams = Partial<{
  agencyId: AgencyId;
  conventionId: ConventionId;
  crawlerInfo: {
    numberOfEvents?: number;
    typeOfEvents: TypeOfEvent;
    processEventsDurationInSeconds?: number; // regrouper avec retrieveEventsDurationInSeconds
    retrieveEventsDurationInSeconds?: number;
  };
  error: Error | Partial<SQLError> | AxiosError;
  events: DomainEvent[];
  nodeProcessReport: NodeProcessReport;
  notificationId: string;
  schemaParsingInput: unknown;
  peConnect: Partial<{
    peId: ConventionId;
    originalId: ConventionId;
    peExternalId: PeExternalId;
    isJobSeeker: boolean;
  }>;
  reportContent: string;
  adapters: {
    repositories: "IN_MEMORY" | "PG";
    notificationGateway: "IN_MEMORY" | "BREVO";
    apiAddress: "IN_MEMORY" | "OPEN_CAGE_DATA";
    siretGateway: "IN_MEMORY" | "HTTPS" | "INSEE" | "ANNUAIRE_DES_ENTREPRISES";
    romeRepository: "IN_MEMORY" | "PG";
  };
  request: Pick<Request, "path" | "method" | "body">;
  requestId: string;
  response: PartialResponse | SubscriberResponse | HttpResponse<any, any>;
  search: LaBonneBoiteRequestParams | SearchMadeEntity;
  status: "success" | "total" | "error" | AuthorisationStatus;
  subscriptionId: string;
  topic: DomainTopic;
  useCaseName: string;
  //------- à vérifier
  durationInSeconds: number;
  // --------------------------------
}>;

export type OpacifiedLogger = {
  debug: LoggerFunction;
  info: LoggerFunction;
  warn: LoggerFunction;
  error: LoggerFunction;
  trace: LoggerFunction;
  fatal: LoggerFunction;
  silent: LoggerFunction;
  level: string;
};

export type LoggerParamsWithMessage = LoggerParams & {
  message?: string;
};

type LoggerFunction = (params: LoggerParamsWithMessage) => void;

export const createLogger = (filename: string): OpacifiedLogger => {
  const logger = rootLogger.child({ name: path.basename(filename) });

  const makeLogFunction =
    (method: keyof OpacifiedLogger): LoggerFunction =>
    ({
      adapters,
      agencyId,
      conventionId,
      durationInSeconds,
      error,
      events,
      message,
      nodeProcessReport,
      notificationId,
      crawlerInfo,
      peConnect,
      reportContent,
      request,
      requestId,
      response,
      schemaParsingInput,
      search,
      status,
      subscriptionId,
      topic,
      useCaseName,
    }) => {
      if (method === "level") return {};

      //TODO: sanitize error
      const opacifiedLogContent = {
        adapters,
        agencyId,
        conventionId,
        durationInSeconds,
        error,
        events: events && sanitizeEvents(events),
        nodeProcessReport,
        notificationId,
        crawlerInfo,
        peConnect,
        reportContent,
        request,
        requestId,
        response,
        schemaParsingInput,
        search,
        status,
        subscriptionId,
        topic,
        useCaseName,
      };

      logger[method](opacifiedLogContent, message);
    };

  return {
    debug: makeLogFunction("debug"),
    info: makeLogFunction("info"),
    error: makeLogFunction("error"),
    warn: makeLogFunction("warn"),
    trace: makeLogFunction("trace"),
    silent: makeLogFunction("silent"),
    fatal: makeLogFunction("fatal"),
    level: "",
  };
};

const sanitizeEvents = (events: DomainEvent[]) =>
  events.map(({ publications, id, topic, wasQuarantined }: DomainEvent) => {
    const publishCount = publications.length;
    const lastPublication = publications[publishCount - 1];

    return {
      eventId: id,
      topic: topic,
      wasQuarantined: wasQuarantined,
      lastPublishedAt: lastPublication?.publishedAt,
      failedSubscribers: lastPublication?.failures,
      publishCount,
    };
  });
