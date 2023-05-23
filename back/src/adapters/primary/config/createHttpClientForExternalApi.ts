import axios, { AxiosInstance, AxiosResponse } from "axios";
import { calculateDurationInSecondsFrom } from "shared";
import { configureHttpClient, createAxiosHandlerCreator } from "http-client";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export const getRequestInfos = (
  response?: AxiosResponse,
  options: { logRequestBody?: boolean; logResponseBody?: boolean } = {},
) => {
  if (!response) {
    return { error: "error.response is not defined, cannot extract infos" };
  }
  const requestedAt = (response.config as any).metadata.requestedAt;

  return {
    ...(requestedAt
      ? {
          durationInSeconds: calculateDurationInSecondsFrom(
            new Date(requestedAt),
          ),
        }
      : {}),
    host: response.request?.host,
    httpStatus: response.status,
    method: response.config?.method,
    url: response.config?.url,
    ...(options.logResponseBody ? { responseBody: response.data } : {}),
    ...(options.logRequestBody ? { requestBody: response.config?.data } : {}),
  };
};

export const configureCreateHttpClientForExternalApi = (
  axiosInstance: AxiosInstance = axios.create({
    timeout: 10_000,
  }),
) => {
  axiosInstance.interceptors.request.use((request) => {
    (request as any).metadata = { requestedAt: new Date().toISOString() };
    return request;
  });

  axiosInstance.interceptors.response.use(
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

  return configureHttpClient(createAxiosHandlerCreator(axiosInstance));
};
