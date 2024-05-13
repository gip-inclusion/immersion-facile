import path from "path";
import pino, { Logger } from "pino";
import {
  AgencyDto,
  ConventionDto,
  ConventionId,
  FormEstablishmentDto,
} from "shared";
import { NodeProcessReport } from "./nodeProcessReport";
import { SearchMade } from "../domains/establishment/entities/SearchMadeEntity";
import { QueryResult } from "kysely";
import { QueryResultRow } from "pg";

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
  agency: Partial<AgencyDto>;
  convention: Partial<ConventionDto>;
  formEstablishment: Partial<FormEstablishmentDto>;
  search: Partial<SearchMade>;
  nodeProcessReport: NodeProcessReport;
  error: Error | Partial<SQLError>;
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
