import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import {
  AxiosErrorWithResponse,
  AxiosInfrastructureError,
  ConnectionRefusedError,
  ConnectionResetError,
  ErrorMapper,
  HttpClientError,
  HttpServerError,
  InfrastructureErrorKinds,
  isHttpError,
  TargetUrlsMapper,
  toHttpError,
  toInfrastructureError,
  toMappedErrorMaker,
  toUnhandledError,
  UnhandledError,
} from "shared/src/serenity-http-client";
import axios, {
  AxiosError,
  AxiosResponse,
} from "../../../../node_modules/axios";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import {
  ManagedRedirectError,
  RawRedirectError,
} from "../../primary/helpers/redirectErrors";
import { PeConnectUrlTargets } from "./HttpPeConnectGateway";

export const httpPeConnectGatewayTargetMapperMaker = (config: {
  peAuthCandidatUrl: AbsoluteUrl;
  immersionFacileBaseUrl: AbsoluteUrl;
  peApiUrl: AbsoluteUrl;
}): TargetUrlsMapper<PeConnectUrlTargets> => ({
  OAUTH2_AUTH_CODE_STEP_1: (): AbsoluteUrl =>
    `${config.peAuthCandidatUrl}/connexion/oauth2/authorize`,
  OAUTH2_ACCESS_TOKEN_STEP_2: () =>
    `${config.peAuthCandidatUrl}/connexion/oauth2/access_token?realm=%2Findividu`,
  REGISTERED_REDIRECT_URL: () =>
    `${config.immersionFacileBaseUrl}/api/pe-connect`,
  PECONNECT_USER_INFO: () =>
    `${config.peApiUrl}/partenaire/peconnect-individu/v1/userinfo`,
  PECONNECT_ADVISORS_INFO: () =>
    `${config.peApiUrl}/partenaire/peconnect-conseillers/v1/contactspe/conseillers`,
});

// TODO Improve with default mappers to reduce repetition
export const peConnectApiErrorsToDomainErrors: ErrorMapper<PeConnectUrlTargets> =
  {
    PECONNECT_ADVISORS_INFO: {
      HttpClientForbiddenError: (error) => {
        notifyObjectDiscord({
          target: "PECONNECT_ADVISORS_INFO",
          name: error.name,
          message: JSON.stringify(error.cause, null, 2),
          httpStatusCode: (error as HttpClientError).httpStatusCode,
        });
        return new ManagedRedirectError(
          "peConnectAdvisorForbiddenAccess",
          error,
        );
      },
      HttpClientError: (error) =>
        handleHttpError("PECONNECT_ADVISORS_INFO", error as HttpClientError),
      HttpServerError: (error) =>
        handleHttpError("PECONNECT_ADVISORS_INFO", error as HttpServerError),
      UnhandledError: (error) =>
        handleUnhandledError(
          "PECONNECT_ADVISORS_INFO",
          error as UnhandledError,
        ),
      AxiosInfrastructureError: (error) =>
        handleInfrastructureError(
          "PECONNECT_ADVISORS_INFO",
          error as AxiosInfrastructureError,
        ),
      ConnectionRefusedError: (error) =>
        handleInfrastructureError(
          "PECONNECT_ADVISORS_INFO",
          error as ConnectionRefusedError,
        ),
      ConnectionResetError: (error) =>
        handleInfrastructureError(
          "PECONNECT_ADVISORS_INFO",
          error as ConnectionResetError,
        ),
    },
    PECONNECT_USER_INFO: {
      HttpClientForbiddenError: (error) => {
        notifyObjectDiscord({
          target: "PECONNECT_USER_INFO",
          name: error.name,
          message: JSON.stringify(error.cause, null, 2),
          httpStatusCode: (error as HttpClientError).httpStatusCode,
        });
        return new ManagedRedirectError("peConnectUserForbiddenAccess", error);
      },
      HttpClientError: (error) =>
        handleHttpError("PECONNECT_USER_INFO", error as HttpClientError),
      HttpServerError: (error) =>
        handleHttpError("PECONNECT_USER_INFO", error as HttpServerError),
      UnhandledError: (error) =>
        handleUnhandledError("PECONNECT_USER_INFO", error as UnhandledError),
      AxiosInfrastructureError: (error) =>
        handleInfrastructureError(
          "PECONNECT_USER_INFO",
          error as AxiosInfrastructureError,
        ),
      ConnectionRefusedError: (error) =>
        handleInfrastructureError(
          "PECONNECT_USER_INFO",
          error as ConnectionRefusedError,
        ),
      ConnectionResetError: (error) =>
        handleInfrastructureError(
          "PECONNECT_USER_INFO",
          error as ConnectionResetError,
        ),
    },
    OAUTH2_ACCESS_TOKEN_STEP_2: {
      HttpClientError: (error) => {
        if (isInvalidGrantError(error as HttpClientError))
          return new ManagedRedirectError("peConnectInvalidGrant", error);

        notifyHttpErrorsToHandleBetter(
          "OAUTH2_ACCESS_TOKEN_STEP_2",
          error as HttpClientError,
        );

        return new RawRedirectError(error.name, error.message, error);
      },
      HttpServerError: (error) =>
        handleHttpError("OAUTH2_ACCESS_TOKEN_STEP_2", error as HttpServerError),
      UnhandledError: (error) =>
        handleUnhandledError(
          "OAUTH2_ACCESS_TOKEN_STEP_2",
          error as UnhandledError,
        ),
      AxiosInfrastructureError: (error) =>
        handleInfrastructureError(
          "OAUTH2_ACCESS_TOKEN_STEP_2",
          error as AxiosInfrastructureError,
        ),
      ConnectionRefusedError: (error) =>
        handleInfrastructureError(
          "OAUTH2_ACCESS_TOKEN_STEP_2",
          error as ConnectionRefusedError,
        ),
      ConnectionResetError: (error) =>
        handleInfrastructureError(
          "OAUTH2_ACCESS_TOKEN_STEP_2",
          error as ConnectionResetError,
        ),
    },
  };

const notifyHttpErrorsToHandleBetter = (
  target: string,
  error: HttpClientError,
) =>
  notifyObjectDiscord({
    target,
    name: error.name,
    message: JSON.stringify(error.cause, null, 2),
    httpStatusCode: error.httpStatusCode,
  });

const notifyUnhandledErrorToHandleBetter = (
  target: string,
  error: UnhandledError,
) =>
  notifyObjectDiscord({
    target,
    name: `UnhandledError ${error.name}`,
    message: JSON.stringify(error.cause, null, 2),
  });

const notifyInfrastructureErrorToHandleBetter = (
  target: string,
  error: InfrastructureErrorKinds,
) =>
  notifyObjectDiscord({
    target,
    name: `InfrastructureError ${error.name}`,
    message: JSON.stringify(error.cause, null, 2),
    code: error.code,
  });

const handleInfrastructureError = (
  target: string,
  error: InfrastructureErrorKinds,
) => {
  notifyInfrastructureErrorToHandleBetter(target, error);
  return new RawRedirectError(error.name, error.message, error);
};

const handleUnhandledError = (target: string, error: UnhandledError) => {
  notifyUnhandledErrorToHandleBetter(target, error);
  return new RawRedirectError(error.name, error.message, error);
};

const handleHttpError = (
  target: string,
  error: HttpClientError | HttpServerError,
) => {
  notifyHttpErrorsToHandleBetter(target, error);
  return new RawRedirectError(error.name, error.message, error);
};

const isInvalidGrantError = (error: HttpClientError) => {
  notifyObjectDiscord({ debug: "test invalid grant", ...error });
  return (error.cause as AxiosError).response?.data.error === "invalid_grant";
};

const isValidPeErrorResponse = (
  response: AxiosResponse | undefined,
): response is AxiosResponse =>
  !!response && typeof response.status === "number";

export const onRejectPeSpecificResponseInterceptorMaker = <
  TargetUrls extends string,
>(context: {
  target: TargetUrls;
  errorMapper: ErrorMapper<TargetUrls>;
}) => {
  const toMappedError = toMappedErrorMaker(context.target, context.errorMapper);

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
    if (!isValidPeErrorResponse(rawAxiosError.response))
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
