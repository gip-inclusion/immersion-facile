import axios, { AxiosError, AxiosResponse } from "axios";

import { ErrorMapper, isHttpError } from "../httpClient";
import { toMappedErrorMaker, toUnhandledError } from "../httpClient.mappers";

import { AxiosErrorWithResponse } from "./axios.adapter";
import { toHttpError, toInfrastructureError } from "./axios.mappers";
import { InfrastructureErrorKinds } from "./errors";

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

  // TODO Because error handling logic is complicated
  //  it should be worth it to extract part of the following logic as functions with clear responsibilities
  return (rawAxiosError: AxiosError): never => {
    // Handle infrastructure and network errors
    const infrastructureError: InfrastructureErrorKinds | undefined =
      toInfrastructureError(rawAxiosError);
    if (infrastructureError) throw toMappedError(infrastructureError);

    // Axios failed to convert the error into a valid error
    if (!axios.isAxiosError(rawAxiosError))
      throw toUnhandledError(
        `error Response does not have the property isAxiosError set to true`,
        rawAxiosError,
      );

    // Error does not satisfy our minimal requirements
    if (!isValidErrorResponse(rawAxiosError.response))
      throw toUnhandledError(
        "error response objects does not have mandatory keys",
        rawAxiosError,
      );

    const error = toHttpError(rawAxiosError as AxiosErrorWithResponse);

    // Failed to convert the error into a valid http error
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
  !!response && typeof response.status === "number";

// TODO Do we want to restrict statuses to a union of HttpCodes ?

// TODO Do we have to further test what is a valid axios response format for us ?
//&& !!headers && !!config: AxiosRequestConfig
