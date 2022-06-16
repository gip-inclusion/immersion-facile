import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { Logger } from "pino";
import { createLogger } from "./logger";

const _logger = createLogger(__filename);

// TODO: Add prometheus counters.

export const createAxiosInstance = (
  logger: Logger = _logger,
  config?: AxiosRequestConfig,
): AxiosInstance => {
  const axiosInstance = axios.create(config);
  axiosInstance.interceptors.request.use((request) => {
    logger.debug(
      { request: extractPartialRequest(request) },
      "Sending HTTP request",
    );
    return request;
  });
  axiosInstance.interceptors.response.use((response) => {
    logger.debug(
      { response: extractPartialResponse(response) },
      "Received HTTP response",
    );
    return response;
  });
  return axiosInstance;
};

const QUOTA_EXEEDED_STATUSES = new Set([429, 503]);
const TIMEOUT_CODES = new Set(["ETIMEDOUT", "ECONNABORTED"]);

export const isRetryableError = (logger: Logger, error: any): boolean => {
  if (QUOTA_EXEEDED_STATUSES.has(error.response?.status)) {
    logger.warn("Request quota exceeded: " + error);
    return true;
  }
  if (TIMEOUT_CODES.has(error.code)) {
    logger.warn("Request timed out: " + error);
    return true;
  }

  return false;
};

export const logAxiosError = (logger: Logger, error: any, msg?: string) => {
  const message = `${msg || "Axios error"}: ${error}`;
  if (error.response) {
    logger.error({ response: extractPartialResponse(error.response) }, message);
  } else {
    logger.error(message);
  }
};

export const PrettyAxiosResponseError = (message: string, error: any): Error =>
  new Error(
    JSON.stringify(
      {
        _message: message,
        status: `${error?.response?.status}`,
        kind: `${error?.kind}`,
        error_description: `${error?.response?.data?.error_description}`,
        error: `${error?.response?.data?.error}`,
      },
      null,
      2,
    ),
  );

const extractPartialRequest = (request: AxiosRequestConfig) => ({
  method: request.method,
  url: request.url,
  params: request.params,
  timeout: request.timeout,
});

const extractPartialResponse = (response: AxiosResponse) => ({
  status: response.status,
  statusText: response.statusText,
  data: response.data,
  request: extractPartialRequest(response.config ?? response.request),
});
