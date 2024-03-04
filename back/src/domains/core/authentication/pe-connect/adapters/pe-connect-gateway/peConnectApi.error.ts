import { AxiosError } from "axios";
import { HTTP_STATUS, ManagedRedirectError, RawRedirectError } from "shared";
import { UnhandledError } from "../../../../../../config/helpers/unhandledError";
import { PeConnectExternalRoutes } from "./peConnectApi.routes";

type PeConnectTargetsKind = keyof PeConnectExternalRoutes;

class ConnectionRefusedError extends Error {
  constructor(
    public override readonly message: string = "Could not connect to server",
    public override readonly cause?: Error,
  ) {
    super();
    // Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
  }
}

// ! In a map the highest priority is given to the lasted entry
export const peConnectErrorStrategy = (
  error: AxiosError,
  context: PeConnectTargetsKind,
) =>
  new Map<boolean, UnhandledError | RawRedirectError | ManagedRedirectError>([
    // Generic catch all Http errors
    [
      isHttpClientError4XX(error),
      makeRawRedirectError(
        "Une erreur est survenue lors de la connexion aux services France Travail",
        error,
      ),
    ],
    [
      isHttpServerError5XX(error),
      makeRawRedirectError(
        "Une erreur est survenue lors de la connexion aux services France Travail",
        error,
      ),
    ],
    [hasNoErrorIdentifier(error), makeUnknownError(error)],
    // Specific error management
    [
      error instanceof ConnectionRefusedError,
      makeRawRedirectError(
        "Le serveur distant de France Travail refuse la connexion.",
        error,
      ),
    ],
    [
      isGetUserInfoServerInternalError(context, error),
      makeRawRedirectError(
        "Nous n’avons pas réussi à récupérer vos informations personnelles pôle emploi connect.",
        error,
      ),
    ],
    [
      isGetUserStatusInfoServerInternalError(context, error),
      makeRawRedirectError(
        "Nous n’avons pas réussi à récupérer votre status pôle emploi connect.",
        error,
      ),
    ],
    [
      isAdvisorsServerInternalError(context, error),
      makeRawRedirectError(
        "Nous n’avons pas réussi à récupérer vos conseillers référents alors que vous êtes demandeur d’emploi. Cette situation ne devrait pas survenir.",
        error,
      ),
    ],
    [
      isAdvisorForbiddenError(error, context),
      new ManagedRedirectError("peConnectAdvisorForbiddenAccess", error),
    ],
    [
      isGetUserInfoForbiddenError(error, context),
      new ManagedRedirectError("peConnectGetUserInfoForbiddenAccess", error),
    ],
    [
      isGetUserStatusInfoForbiddenError(error, context),
      new ManagedRedirectError(
        "peConnectGetUserStatusInfoForbiddenAccess",
        error,
      ),
    ],
    [
      error.code === "ECONNABORTED",
      new ManagedRedirectError("peConnectConnectionAborted", error),
    ],
    [
      error.message === "Network Error",
      new RawRedirectError(
        "Une erreur est survenue - Erreur réseau",
        "Nous n’avons pas réussi à joindre pôle emploi connect.",
        error,
      ),
    ],
    [
      isInvalidGrantError(context, error),
      new ManagedRedirectError("peConnectInvalidGrant", error),
    ],
  ]);

const isInvalidGrantError = (
  context: PeConnectTargetsKind,
  error: AxiosError,
) =>
  context === "exchangeCodeForAccessToken" &&
  error.response?.status === HTTP_STATUS.BAD_REQUEST &&
  (error.response?.data as { error?: string }).error === "invalid_grant";

const hasNoErrorIdentifier = (error: AxiosError) =>
  !error.response?.status && !error.code;

const rawRedirectTitle = (error: AxiosError) =>
  `Une erreur est survenue - ${error.response?.status ?? error.code}`;

const isGetUserInfoServerInternalError = (
  context: PeConnectTargetsKind,
  error: AxiosError,
) =>
  context === "getUserInfo" &&
  error.response?.status === HTTP_STATUS.INTERNAL_SERVER_ERROR;

const isGetUserStatusInfoServerInternalError = (
  context: PeConnectTargetsKind,
  error: AxiosError,
) =>
  context === "getUserStatutInfo" &&
  error.response?.status === HTTP_STATUS.INTERNAL_SERVER_ERROR;

const isAdvisorsServerInternalError = (
  context: PeConnectTargetsKind,
  error: AxiosError,
) =>
  context === "getAdvisorsInfo" &&
  error.response?.status === HTTP_STATUS.INTERNAL_SERVER_ERROR;

const makeUnknownError = (error: AxiosError) =>
  new UnhandledError("Code erreur inconnu", error);

const makeRawRedirectError = (
  message: string,
  error: AxiosError<any, any>,
): RawRedirectError =>
  new RawRedirectError(rawRedirectTitle(error), message, error);

const isAdvisorForbiddenError = (
  error: AxiosError,
  context: PeConnectTargetsKind,
): boolean =>
  error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
  context === "getAdvisorsInfo";

const isGetUserInfoForbiddenError = (
  error: AxiosError<any, any>,
  context: PeConnectTargetsKind,
): boolean =>
  error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
  context === "getUserInfo";

const isGetUserStatusInfoForbiddenError = (
  error: AxiosError<any, any>,
  context: PeConnectTargetsKind,
): boolean =>
  error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
  context === "getUserStatutInfo";

const isHttpServerError5XX = (error: AxiosError): boolean =>
  !!error &&
  !!error.response &&
  !!error.response.status &&
  error.response.status.toString().startsWith("5");

const isHttpClientError4XX = (error: AxiosError): boolean =>
  !!error &&
  !!error.response &&
  !!error.response.status &&
  error.response.status.toString().startsWith("4");