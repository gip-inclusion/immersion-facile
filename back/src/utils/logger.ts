import path from "path";
import { Request } from "express";
import { QueryResult } from "kysely";
import pino, { Logger } from "pino";
import {
  AgencyDto,
  AgencyId,
  ApiConsumerName,
  ConventionDto,
  ConventionId,
  ConventionJwtPayload,
  FormEstablishmentDto,
  Role,
} from "shared";
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
  agency: Partial<AgencyDto>;
  agencyId: AgencyId;
  api: string;
  apiAddress: "IN_MEMORY" | "OPEN_CAGE_DATA";
  authorisationStatus: AuthorisationStatus;
  body: object;
  consumerName: ApiConsumerName;
  context: Record<string, string>;
  convention: Partial<ConventionDto>;
  conventionId: ConventionId;
  counterType: string;
  crawlingPeriodMs: number;
  data: unknown;
  durationInSeconds: number;
  email: string;
  error: Error | Partial<SQLError>;
  errorMessage: string;
  errorType: string;
  eventId: string;
  events: EventToDebugInfo[];
  formEstablishment: Partial<FormEstablishmentDto>;
  host: string;
  httpStatus: number;
  jwt: string;
  markEventsAsInProcessDurationInSeconds: number;
  method: string;
  newOutboxSize: number;
  nodeProcessReport: NodeProcessReport;
  notificationGateway: "IN_MEMORY" | "BREVO";
  notificationId: string;
  numberOfEvent: number;
  pathname: string;
  payload: ConventionJwtPayload;
  peConvention: {
    peId: string;
    originalId: string;
  };
  processEventsDurationInSeconds: number;
  query: string;
  recipients: Recipient[];
  reportContent: string;
  repositories: "IN_MEMORY" | "PG";
  request: Pick<Request, "path" | "method" | "body">;
  requestId: string;
  response: PartialResponse | SubscriberResponse;
  retrieveEventsDurationInSeconds: number;
  role: Role;
  romeRepository: "IN_MEMORY" | "PG";
  route: string;
  routeName: string;
  search: Partial<SearchMade>;
  siretGateway: "IN_MEMORY" | "HTTPS" | "INSEE" | "ANNUAIRE_DES_ENTREPRISES";
  stack: string;
  status: string;
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

type LoggerFunction = (params: LoggerParams & { message?: string }) => void;

export const createLogger = (filename: string): OpacifiedLogger => {
  const logger = rootLogger.child({ name: path.basename(filename) });

  const makeLogFunction =
    (method: keyof OpacifiedLogger): LoggerFunction =>
    ({
      agency,
      convention,
      formEstablishment,
      search,
      nodeProcessReport,
      message,
      error,
    }) => {
      if (method === "level") return {};

      const parsedConvention = { id: convention?.id };
      const parsedAgency = { id: agency?.id };
      const parsedFormEstablishment = {
        businessName: formEstablishment?.businessName,
        siret: formEstablishment?.siret,
      };

      //TODO: sanitize error
      logger[method](
        {
          agency: parsedAgency,
          convention: parsedConvention,
          formEstablishment: parsedFormEstablishment,
          search,
          nodeProcessReport,
          error,
        },
        message,
      );
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
