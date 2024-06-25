import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { OpacifiedLogger, createLogger } from "./logger";

const _logger = createLogger(__filename);

export const createAxiosInstance = (
  logger = _logger,
  config?: AxiosRequestConfig,
): AxiosInstance => {
  const axiosInstance = axios.create(config);
  axiosInstance.interceptors.response.use((response) => {
    logger.debug({
      axiosResponse: response,
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
    logger.warn({ message: "Request quota exceeded", error });
    return true;
  }
  if (error.code && TIMEOUT_CODES.has(error.code)) {
    logger.warn({ message: "Request timed out", error });
    return true;
  }

  return false;
};
