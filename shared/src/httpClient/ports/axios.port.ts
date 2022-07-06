//TODO Découpler les notions entre axios et client http générique ?

import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { HttpClientError } from "../errors/4xxClientError.error";
import { HttpServerError } from "../errors/5xxServerError.error";
import {
  ConnectionRefusedError,
  isConnectionRefusedError,
} from "../errors/ConnectionRefused.error";
import { isHttpClientError, isHttpServerError } from "../httpClient";

// TODO For now directly use this
export const createManagedAxiosInstance = (): AxiosInstance => {
  const axiosRequestConfig = {};

  const axiosInstance = axios.create(axiosRequestConfig);
  axiosInstance.interceptors.request.use(
    (request) => request,
    axiosErrorRequestInterceptor,
  );

  axiosInstance.interceptors.response.use(
    (validResponse) => validResponse,
    axiosErrorResponseInterceptor,
  );

  return axiosInstance;
};

const axiosErrorResponseInterceptor = (rawAxiosError: AxiosError): never => {
  handleConnectionRefused(rawAxiosError);

  const error: AxiosError & { response: AxiosResponse } =
    validateAxiosErrorResponse(rawAxiosError);

  handleHttpClientError(error);
  handleServerError(error);

  throw Error(`We should never reach here`, error);
};

const axiosErrorRequestInterceptor = (error: any): never => {
  throw new Error("Invalid request", { cause: error });
};

export const isValidAxiosErrorResponse = (
  response: AxiosResponse | undefined,
): response is AxiosResponse =>
  !!response &&
  isValidResponseBody(response.data) &&
  typeof response.status === "number";

// TODO Do we want to restrict statuses to a union of HttpCodes ?

// TODO Do we have to further test what is a valid axios response format for us ?
//&& !!headers && !!config: AxiosRequestConfig

const isValidResponseBody = (data: any): boolean => !!data || data === "";

const handleHttpClientError = (
  error: AxiosError & { response: AxiosResponse },
): never | void => {
  // TODO Manage some specific status here ? (429)
  if (isHttpClientError(error.response.status)) throwClientError(error);
};

const handleServerError = (
  error: AxiosError & { response: AxiosResponse },
): never | void => {
  if (isHttpServerError(error.response.status)) throwServerError(error);
};

const throwClientError = (error: AxiosError): never => {
  throw new HttpClientError(
    `4XX Status Code ${toAxiosHttpErrorString(error)}`,
    error,
  );
};

const throwServerError = (error: AxiosError): never => {
  throw new HttpServerError(
    `5XX Status Code ${toAxiosHttpErrorString(error)}`,
    error,
  );
};

const handleConnectionRefused = (error: AxiosError): never | void => {
  if (isConnectionRefusedError(error))
    throw new ConnectionRefusedError(
      `Could not connect to server : ${toRawErrorString(error)}`,
      error,
    );
};

const validateAxiosErrorResponse = (
  error: AxiosError & { response?: AxiosResponse },
): AxiosError & { response: AxiosResponse } => {
  if (!axios.isAxiosError(error))
    throwUnhandledError(
      `error Response does not have the property isAxiosError set to true`,
      error,
    );

  if (!isValidAxiosErrorResponse(error.response))
    throwUnhandledError(
      "error response objects does not have mandatory keys",
      error,
    );

  return error as AxiosError & { response: AxiosResponse };
};

export const throwUnhandledError = (
  details: string,
  error: AxiosError,
): never => {
  let rawString: string;
  try {
    rawString = JSON.stringify(error);
  } catch (stringifyError: any) {
    const keys: string[] = Object.keys(error);
    rawString = `Failed to JSON.stringify the error due to : ${
      stringifyError?.message
    }. 
    Raw object keys : ${
      keys.length > 0
        ? keys.join("\n")
        : "Object.keys(error) returned an empty array"
    }`;
  }
  throw new Error(
    `Unhandled Http Client Error - ${details} - JSON Stringify tentative result -> ${rawString}`,
    { cause: error },
  );
};

const toAxiosHttpErrorString = (error: AxiosError): string =>
  JSON.stringify(
    {
      requestConfig: {
        url: error.response?.config?.url,
        headers: error.response?.config?.headers,
        method: error.response?.config?.method,
        data: error.response?.config?.data,
        timeout: error.response?.config?.timeout,
      },
      data: error.response?.data,
      status: error.response?.status,
    },
    null,
    2,
  );

const toRawErrorString = (error: any): string =>
  JSON.stringify(
    {
      code: error.code,
      address: error.address,
      port: error.port,
      config: {
        headers: error.config?.headers,
        method: error.config?.method,
        url: error.config?.url,
        data: error.config?.data,
      },
    },
    null,
    2,
  );
