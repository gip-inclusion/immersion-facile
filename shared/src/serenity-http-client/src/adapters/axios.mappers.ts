import { AxiosError } from "../../../../node_modules/axios";
import { HttpClientError, HttpClientForbiddenError } from "../errors";
import { HttpServerError } from "../errors";
import { isHttpClientError } from "../httpClient";
import { AxiosErrorWithResponse } from "./axios.adapter";
import {
  ConnectionRefusedError,
  ConnectionResetError,
  AxiosInfrastructureError,
  isAxiosInfrastructureError,
  isTCPWrapperConnectionRefusedError,
  isTCPWrapperConnectionResetError,
  InfrastructureError,
  AxiosInfrastructureErrorCodes,
} from "./errors";

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

export const toInfrastructureError = (
  error: Error,
): InfrastructureError | undefined => {
  if (isTCPWrapperConnectionRefusedError(error))
    return new ConnectionRefusedError(
      `Could not connect to server : ${toAxiosInfrastructureErrorString(
        error,
      )}`,
      error,
    );

  if (isTCPWrapperConnectionResetError(error))
    return new ConnectionResetError(
      `The other side of the TCP conversation abruptly closed its end of the connection: ${toAxiosInfrastructureErrorString(
        error,
      )}`,
      error,
    );

  if (isAxiosInfrastructureError(error))
    return new AxiosInfrastructureError(
      `Axios infrastructure error: ${toAxiosInfrastructureErrorString(error)}`,
      error,
      (error as unknown as { code: AxiosInfrastructureErrorCodes }).code,
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

const toAxiosInfrastructureErrorString = (error: any): string =>
  JSON.stringify(
    {
      code: error.code,
      address: error.address,
      port: error.port,
      config: {
        headers: error.config?.headers,
        method: error.config?.method,
        url: error.config?.url,
        baseUrl: error.config?.baseUrl,
        data: error.config?.data,
      },
    },
    null,
    2,
  );
