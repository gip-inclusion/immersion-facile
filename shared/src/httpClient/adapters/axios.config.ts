import axios, { AxiosError, AxiosResponse } from "axios";
import {
  toInfrastructureError,
  toMappedErrorMaker,
  toUnhandledError,
} from "../httpClient.mappers";
import { InfrastructureError } from "../errors/InfrastructureError.error";
import { ErrorMapper, isHttpError } from "../httpClient";
import { toHttpError } from "./axios.mappers";
import { AxiosErrorWithResponse } from "./axios.adapter";

export const onFullfilledDefaultResponseInterceptorMaker =
  () =>
  (response: AxiosResponse): AxiosResponse => {
    // eslint-disable-next-line no-console
    console.log(
      "[Axios Managed Response Status]: ",
      response.status,
      " - ",
      response.config.url,
    );
    return response;
  };

export const onRejectDefaultResponseInterceptorMaker = <
  TargetUrls extends string,
>(context: {
  target: TargetUrls;
  errorMapper: ErrorMapper<TargetUrls>;
}) => {
  const toMappedError = toMappedErrorMaker(context.target, context.errorMapper);

  return (rawAxiosError: AxiosError): never => {
    const infrastructureError: InfrastructureError | undefined =
      toInfrastructureError(rawAxiosError);
    if (infrastructureError) throw toMappedError(infrastructureError);

    // TODO Create Unhandled Error type
    if (!axios.isAxiosError(rawAxiosError))
      throw toUnhandledError(
        `error Response does not have the property isAxiosError set to true`,
        rawAxiosError,
      );

    if (!isValidErrorResponse(rawAxiosError.response))
      throw toUnhandledError(
        "error response objects does not have mandatory keys",
        rawAxiosError,
      );

    const error = toHttpError(rawAxiosError as AxiosErrorWithResponse);
    if (!isHttpError(error))
      throw toUnhandledError(
        "failed to convert error to HttpClientError or HttpServerError",
        rawAxiosError,
      );

    throw toMappedError(error);
  };
};

export const isValidErrorResponse = (
  response: AxiosResponse | undefined,
): response is AxiosResponse =>
  !!response && typeof response.status === "number" && !!response.data;

// TODO Do we want to restrict statuses to a union of HttpCodes ?

// TODO Do we have to further test what is a valid axios response format for us ?
//&& !!headers && !!config: AxiosRequestConfig

// TODO Pole Emploi consider "" to be a valid error response body
const _poleEmploiIsValidResponseBody = (data: any): boolean =>
  !!data || data === "";
