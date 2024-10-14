import path from "path";
import {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  isAxiosError,
} from "axios";
import { Request } from "express";
import { QueryResult } from "kysely";
import pino, { Logger, LoggerOptions } from "pino";
import { complement, isNil, pickBy } from "ramda";
import {
  AgencyId,
  ConventionId,
  PeExternalId,
  SearchQueryParamsDto,
} from "shared";
import { HttpResponse } from "shared-routes";
import { AuthorisationStatus } from "../config/bootstrap/authMiddleware";
import { SubscriberResponse } from "../domains/core/api-consumer/ports/SubscribersGateway";
import { TypeOfEvent } from "../domains/core/events/adapters/EventCrawlerImplementations";
import { DomainEvent, DomainTopic } from "../domains/core/events/events";
import { SearchMadeEntity } from "../domains/establishment/entities/SearchMadeEntity";
import { LaBonneBoiteRequestParams } from "../domains/establishment/ports/LaBonneBoiteGateway";
import { NodeProcessReport } from "./nodeProcessReport";

type LogStatus = "debug" | "info" | "ok" | "warn" | "error" | "alert";

const level: LoggerOptions["level"] =
  process.env.LOG_LEVEL || process.env.NODE_ENV === "test" ? "fatal" : "info";

const devTransport: LoggerOptions["transport"] = {
  target: "pino-pretty",
  options: {
    colorize: true,
    singleLine: !process.env.LOGGER_MULTI_LINE,
    translateTime: "yyyy-mm-dd HH:MM:ss.l Z",
    ignore: "pid,hostname",
  },
};

const rootLogger = pino({
  level,
  ...(process.env.NODE_ENV !== "production" ? { transport: devTransport } : {}),
});

// Example use: const logger = createLogger(__filename);
export const legacyCreateLogger = (filename: string): Logger =>
  rootLogger.child({ name: path.basename(filename) });

type SQLError = {
  query: string;
  result: QueryResult<any>;
  error: Error;
};

type LoggerParams = Partial<{
  adapters: {
    repositories: "IN_MEMORY" | "PG";
    notificationGateway: "IN_MEMORY" | "BREVO";
    apiAddress: "IN_MEMORY" | "OPEN_CAGE_DATA";
    siretGateway: "IN_MEMORY" | "HTTPS" | "INSEE" | "ANNUAIRE_DES_ENTREPRISES";
    romeRepository: "IN_MEMORY" | "PG";
  };
  agencyId: AgencyId;
  conventionId: ConventionId;
  crawlerInfo: {
    numberOfEvents?: number;
    typeOfEvents: TypeOfEvent;
    processEventsDurationInSeconds?: number;
    retrieveEventsDurationInSeconds?: number;
  };
  durationInSeconds: number;
  error: Error | Partial<SQLError> | AxiosError;
  events: DomainEvent[];
  nodeProcessReport: NodeProcessReport;
  notificationId: string;
  peConnect: Partial<{
    peId: ConventionId;
    originalId: ConventionId;
    peExternalId: PeExternalId;
    isJobSeeker: boolean;
  }>;
  reportContent: string;
  request: Pick<Request, "path" | "method">;
  requestId: string;
  sharedRouteResponse: HttpResponse<any, any>;
  axiosResponse: AxiosResponse;
  subscriberResponse: SubscriberResponse;
  schemaParsingInput: unknown;
  searchLBB: LaBonneBoiteRequestParams;
  searchMade: SearchMadeEntity;
  searchParams: SearchQueryParamsDto | undefined;
  franceTravailGatewayStatus: "success" | "total" | "error";
  logStatus: LogStatus;
  authorisationStatus: AuthorisationStatus;
  subscriptionId: string;
  topic: DomainTopic;
  useCaseName: string;
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

type LogMethod = keyof OpacifiedLogger;

const logMethodToLogStatus: Record<LogMethod, LogStatus> = {
  info: "info",
  warn: "warn",
  error: "error",
  fatal: "error",
  debug: "debug",
  silent: "debug",
  trace: "debug",
  level: "debug",
};

export type LoggerParamsWithMessage = LoggerParams & {
  message?: string;
};

type LoggerFunction = (params: LoggerParamsWithMessage) => void;

export const createLogger = (filename: string): OpacifiedLogger => {
  const logger = rootLogger.child({ name: path.basename(filename) });

  const makeLogFunction =
    (method: LogMethod): LoggerFunction =>
    ({
      adapters,
      agencyId,
      conventionId,
      crawlerInfo,
      durationInSeconds,
      error,
      events,
      message,
      nodeProcessReport,
      notificationId,
      peConnect,
      reportContent,
      request,
      requestId,
      sharedRouteResponse,
      subscriberResponse,
      axiosResponse,
      schemaParsingInput,
      searchMade,
      searchLBB,
      logStatus,
      authorisationStatus,
      franceTravailGatewayStatus,
      subscriptionId,
      topic,
      useCaseName,
      searchParams,
      ...rest
    }) => {
      const _noValuesForgotten: Record<string, never> = rest;
      if (method === "level") return {};

      const opacifiedLogContent = {
        adapters,
        agencyId,
        conventionId,
        crawlerInfo,
        durationInSeconds,
        error: sanitizeError(error),
        events: sanitizeEvents(events),
        nodeProcessReport,
        notificationId,
        peConnect,
        reportContent,
        request,
        requestId,
        sharedRouteResponse: sanitizeSharedRouteResponse(sharedRouteResponse),
        subscriberResponse,
        axiosResponse: sanitizeAxiosResponse(axiosResponse),
        schemaParsingInput,
        searchMade,
        searchLBB,
        status: logStatus ?? logMethodToLogStatus[method],
        authorisationStatus,
        franceTravailGatewayStatus,
        subscriptionId,
        topic,
        useCaseName,
        searchParams,
      };

      const opacifiedWithoutNullOrUndefined = pickBy(
        complement(isNil),
        opacifiedLogContent,
      );

      logger[method](opacifiedWithoutNullOrUndefined, message);
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

const sanitize =
  <T>(cb: (t: T) => Partial<T>) =>
  (params: T | undefined) => {
    if (!params) return;
    return cb(params);
  };

const sanitizeError = sanitize<
  Error | Partial<SQLError> | AxiosError<unknown, any>
>((error) => {
  if (isAxiosError(error))
    return {
      message: `Axios error : ${error.message}`,
      response: sanitizeAxiosResponse(error.response),
    };

  return error;
});

const sanitizeAxiosResponse = sanitize<AxiosResponse>((response) => {
  const req = response.config ?? response.request;

  if (response.status >= 200 && response.status < 400) {
    return {
      status: response.status,
      method: req.method,
      url: req.url,
    };
  }

  return {
    status: response.status,
    statusText: response.statusText,
    data: response.data as unknown,
    request: extractPartialRequest(req),
  };
});

const sanitizeSharedRouteResponse = sanitize<HttpResponse<any, any>>(
  (response) => {
    if (response.status >= 200 && response.status < 400) {
      return {
        status: response.status,
      };
    }

    return {
      status: response.status,
      body: response.body,
    };
  },
);

export type PartialRequest = {
  method: string | undefined;
  url: string | undefined;
  params: unknown;
  timeout: number | undefined;
};

const extractPartialRequest = (
  request: AxiosRequestConfig,
): PartialRequest => ({
  method: request.method,
  url: request.url,
  params: request.params as unknown,
  timeout: request.timeout,
});

const sanitizeEvents = (events: DomainEvent[] | undefined) => {
  if (!events) return;
  return events.map(
    ({ publications, id, topic, wasQuarantined }: DomainEvent) => {
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
    },
  );
};
