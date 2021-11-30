import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { Logger } from "pino";
import { createLogger } from "./logger";

const _logger = createLogger(__filename);

// TODO(nsw): Add prometheus counters.

export const createAxiosInstance = (
  logger: Logger = _logger,
  config?: AxiosRequestConfig,
): AxiosInstance => {
  const axiosInstance = axios.create(config);
  axiosInstance.interceptors.request.use((request) => {
    logger.info(
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

export const logAxiosError = (logger: Logger, error: any, msg?: string) => {
  if (error.response) {
    logger.error(
      { response: extractPartialResponse(error.response) },
      msg || error.message,
    );
  } else {
    logger.error(error, msg);
  }
};

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
  request: extractPartialRequest(response.config),
});
