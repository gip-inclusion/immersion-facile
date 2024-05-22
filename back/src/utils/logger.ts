import path from "path";
import { AxiosError } from "axios";
import { Request } from "express";
import { QueryResult } from "kysely";
import pino, { Logger } from "pino";
import {
  AgencyId,
  ApiConsumerName,
  ConventionId,
  ConventionJwtPayload,
  FormEstablishmentDto,
  PeExternalId,
  Role,
} from "shared";
import { HttpResponse } from "shared-routes";
import { AuthorisationStatus } from "../config/bootstrap/authMiddleware";
import { Recipient } from "../domains/convention/use-cases/notifications/NotifyNewConventionNeedsReview";
import { SubscriberResponse } from "../domains/core/api-consumer/ports/SubscribersGateway";
import { TypeOfEvent } from "../domains/core/events/adapters/EventCrawlerImplementations";
import { DomainTopic, EventToDebugInfo } from "../domains/core/events/events";
import { SearchMade } from "../domains/establishment/entities/SearchMadeEntity";
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
  _title: string;
  agencyId: AgencyId;
  api: string;
  authorisationStatus: AuthorisationStatus;
  consumerName: ApiConsumerName;
  context: Record<string, string>;
  conventionId: ConventionId;
  crawlingPeriodMs: number;
  durationInSeconds: number;
  email: string;
  error: Error | Partial<SQLError> | AxiosError;
  eventId: string;
  events: EventToDebugInfo[];
  formEstablishment: Partial<FormEstablishmentDto>;
  host: string;
  httpStatus: number;
  jwt: string;
  markEventsAsInProcessDurationInSeconds: number;
  newOutboxSize: number;
  nodeProcessReport: NodeProcessReport;
  notificationId: string;
  numberOfEvent: number;
  pathname: string;
  payload: ConventionJwtPayload;
  schemaParsingInput: unknown;
  peConnect: Partial<{
    peId: ConventionId;
    originalId: ConventionId;
    peExternalId: PeExternalId;
    isJobSeeker: boolean;
  }>;
  processEventsDurationInSeconds: number;
  query: string;
  recipients: Recipient[];
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
  retrieveEventsDurationInSeconds: number;
  role: Role;
  search: Partial<SearchMade>;
  status: "success" | "total" | "error";
  subscriptionId: string;
  token: string;
  topic: DomainTopic;
  type: string;
  typeOfEvents: TypeOfEvent;
  useCaseName: string;
  values: unknown[];
  wasQuarantined: string;
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
      _title,
      adapters,
      agencyId,
      api,
      authorisationStatus,
      consumerName,
      context,
      conventionId,
      crawlingPeriodMs,
      durationInSeconds,
      email,
      error,
      eventId,
      events,
      formEstablishment,
      host,
      httpStatus,
      jwt,
      markEventsAsInProcessDurationInSeconds,
      message,
      newOutboxSize,
      nodeProcessReport,
      notificationId,
      numberOfEvent,
      pathname,
      payload,
      peConnect,
      processEventsDurationInSeconds,
      query,
      recipients,
      reportContent,
      request,
      requestId,
      response,
      retrieveEventsDurationInSeconds,
      role,
      schemaParsingInput,
      search,
      status,
      subscriptionId,
      token,
      topic,
      type,
      typeOfEvents,
      useCaseName,
      values,
      wasQuarantined,
    }) => {
      if (method === "level") return {};

      //TODO: sanitize error
      const opacifiedLogContent = {
        _title,
        adapters,
        agencyId,
        api,
        authorisationStatus,
        consumerName,
        context,
        conventionId,
        crawlingPeriodMs,
        durationInSeconds,
        email,
        error,
        eventId,
        events,
        formEstablishment: opacifiedFormEstablishment(formEstablishment),
        host,
        httpStatus,
        jwt,
        markEventsAsInProcessDurationInSeconds,
        newOutboxSize,
        nodeProcessReport,
        notificationId,
        numberOfEvent,
        pathname,
        payload,
        peConnect,
        processEventsDurationInSeconds,
        query,
        recipients,
        reportContent,
        request,
        requestId,
        response,
        retrieveEventsDurationInSeconds,
        role,
        schemaParsingInput,
        search,
        status,
        subscriptionId,
        token,
        topic,
        type,
        typeOfEvents,
        useCaseName,
        values,
        wasQuarantined,
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
function opacifiedFormEstablishment(
  formEstablishment: Partial<FormEstablishmentDto> | undefined,
) {
  return {
    businessName: formEstablishment?.businessName,
    siret: formEstablishment?.siret,
  };
}
