import {
  HttpClientError,
  HttpClientForbiddenError,
} from "../errors/HttpClientError.error";
import { HttpServerError } from "../errors/HttpServerError.error";

import { AxiosError } from "../../../../node_modules/axios";
import { isHttpClientError } from "../httpClient";
import { AxiosErrorWithResponse } from "./axios.adapter";
export const toHttpError = (
  error: AxiosErrorWithResponse,
): HttpClientError | HttpServerError | undefined => {
  if (isHttpClientError(error.response.status)) {
    if (error.response.status === 401)
      return new HttpClientForbiddenError(`Forbidden Access`, error);

    return new HttpClientError(
      `4XX Status Code ${toAxiosHttpErrorString(error)}`,
      error,
      error.response.status,
    );
  }

  if (isHttpClientError(error.response.status)) {
    return new HttpServerError(
      `5XX Status Code ${toAxiosHttpErrorString(error)}`,
      error,
      error.response.status,
    );
  }
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
