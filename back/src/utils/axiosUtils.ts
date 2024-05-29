import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { OpacifiedLogger, createLogger } from "./logger";

const _logger = createLogger(__filename);

export const createAxiosInstance = (
  logger = _logger,
  config?: AxiosRequestConfig,
): AxiosInstance => {
  const axiosInstance = axios.create(config);
  axiosInstance.interceptors.response.use((response) => {
    logger.debug({
      response: extractPartialResponse(response),
      message: "Received HTTP response",
    });
    return response;
  });
  return axiosInstance;
};

const QUOTA_EXEEDED_STATUSES = new Set([429, 503]);
const TIMEOUT_CODES = new Set(["ETIMEDOUT", "ECONNABORTED"]);

export const isRetryableError = (
  logger: OpacifiedLogger,
  error: AxiosError,
): boolean => {
  if (
    error.response?.status &&
    QUOTA_EXEEDED_STATUSES.has(error.response?.status)
  ) {
    logger.warn(`Request quota exceeded: ${error}`);
    return true;
  }
  if (error.code && TIMEOUT_CODES.has(error.code)) {
    logger.warn(`Request timed out: ${error}`);
    return true;
  }

  return false;
};

export const logAxiosError = (
  logger: OpacifiedLogger,
  error: AxiosError,
  msg?: string,
) => {
  const message = `${msg || "Axios error"}: ${error}`;
  if (error.response) {
    logger.error({ response: extractPartialResponse(error.response), message });
  } else {
    logger.error(message);
  }
};

export type PartialResponse = {
  status: number;
  statusText: string;
  data: unknown;
  request: PartialRequest;
};
export const extractPartialResponse = (
  response: AxiosResponse,
): PartialResponse => ({
  status: response.status,
  statusText: response.statusText,
  data: response.data as unknown,
  request: extractPartialRequest(response.config ?? response.request),
});

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
