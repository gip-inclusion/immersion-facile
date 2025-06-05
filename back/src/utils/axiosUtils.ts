import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { createLogger } from "./logger";

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

export const makeAxiosInstances = (timeout: number) => ({
  axiosWithoutValidateStatus: axios.create({
    timeout,
  }),
  axiosWithValidateStatus: axios.create({
    timeout,
    validateStatus: () => true,
  }),
});

export const isAxiosError = axios.isAxiosError;
