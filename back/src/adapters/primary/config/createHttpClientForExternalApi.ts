import axios, { AxiosResponse } from "axios";
import { calculateDurationInSecondsFrom } from "shared";
import { configureHttpClient, createAxiosHandlerCreator } from "http-client";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

const AXIOS_TIMEOUT_MS = 10_000;
export const externalApiAxiosInstance = axios.create({
  timeout: AXIOS_TIMEOUT_MS,
});

const getRequestInfos = (
  response?: AxiosResponse,
  options: { logRequestBody?: boolean; logResponseBody?: boolean } = {},
) => {
  if (!response) {
    return { error: "error.response is not defined, cannot extract infos" };
  }
  const requestedAt = (response.config as any).metadata.requestedAt;
  const durationInSeconds = calculateDurationInSecondsFrom(
    new Date(requestedAt),
  );

  return {
    durationInSeconds,
    host: response.request?.host,
    httpStatus: response.status,
    method: response.config?.method,
    url: response.config?.url,
    ...(options.logResponseBody ? { responseBody: response.data } : {}),
    ...(options.logRequestBody ? { requestBody: response.config?.data } : {}),
  };
};

externalApiAxiosInstance.interceptors.request.use((request) => {
  (request as any).metadata = { requestedAt: new Date().toISOString() };
  return request;
});

externalApiAxiosInstance.interceptors.response.use(
  (response) => {
    logger.info({
      _title: "External Api Call",
      status: "success",
      ...getRequestInfos(response),
    });

    return response;
  },
  (error) => {
    logger.error({
      _title: "External Api Call",
      status: "errored",
      message: error.message,
      ...getRequestInfos(error.response, {
        logRequestBody: true,
        logResponseBody: true,
      }),
    });

    return Promise.reject(error);
  },
);

const axiosHandlerCreator = createAxiosHandlerCreator(externalApiAxiosInstance);
export const createHttpClientForExternalApi =
  configureHttpClient(axiosHandlerCreator);
