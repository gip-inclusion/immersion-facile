import { HttpClientError } from "../errors/HttpClientError.error";
import { HttpServerError } from "../errors/HttpServerError.error";

import { AxiosError } from "axios";
import { isHttpClientError } from "../httpClient";
import { AxiosErrorWithResponse } from "./axios.adapter";
export const toHttpError = (
  error: AxiosErrorWithResponse,
): HttpClientError | HttpServerError | undefined => {
  if (isHttpClientError(error.response.status)) {
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
