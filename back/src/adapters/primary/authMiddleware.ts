import { NextFunction, Request, Response } from "express";
import { TokenExpiredError } from "jsonwebtoken";
import { Clock } from "../../domain/core/ports/Clock";
import { GetApiConsumerById } from "../../domain/core/ports/GetApiConsumerById";
import {
  ApiConsumerName,
  WithApiConsumerId,
} from "../../domain/core/valueObjects/ApiConsumer";
import {
  currentJwtVersions,
  EstablishmentJwtPayload,
  ConventionMagicLinkPayload,
  PayloadKey,
  PayloadOption,
} from "shared/src/tokens/MagicLinkPayload";
import { createLogger } from "../../utils/logger";
import { makeVerifyJwtES256 } from "../../domain/auth/jwt";
import { AppConfig } from "./config/appConfig";
import jwt from "jsonwebtoken";
import promClient from "prom-client";

const logger = createLogger(__filename);

const apiKeyAuthMiddlewareRequestsTotal = new promClient.Counter({
  name: "api_key_auth_middleware_requests_total",
  help: "The total count each api keys that tried to use the api",
  labelNames: ["route", "method", "consumerName", "authorisationStatus"],
});

const convertRouteToLog = (originalUrl: string) =>
  "/" + originalUrl.split("/")[1];

type TotalCountProps = {
  consumerName?: ApiConsumerName;
  authorisationStatus:
    | "authorised"
    | "unauthorisedId"
    | "incorrectJwt"
    | "expiredToken"
    | "consumerNotFound"
    | "unauthenticated";
};

const createIncTotalCountForRequest =
  (req: Request) =>
  ({ consumerName, authorisationStatus }: TotalCountProps) =>
    apiKeyAuthMiddlewareRequestsTotal.inc({
      route: convertRouteToLog(req.originalUrl),
      method: req.method,
      consumerName,
      authorisationStatus,
    });

// should be deleted when all consumer migrate to v1
export const createApiKeyAuthMiddlewareV0 = (
  getApiConsumerById: GetApiConsumerById,
  clock: Clock,
  config: AppConfig,
) => {
  const verifyJwt = makeVerifyJwtES256<WithApiConsumerId>(
    config.apiJwtPublicKey,
  );

  return async (req: Request, _res: Response, next: NextFunction) => {
    const incTotalCountForRequest = createIncTotalCountForRequest(req);
    if (!req.headers.authorization) {
      incTotalCountForRequest({ authorisationStatus: "unauthenticated" });
      return next();
    }

    try {
      const { id } = verifyJwt(req.headers.authorization);
      const apiConsumer = await getApiConsumerById(id);
      if (!apiConsumer) {
        incTotalCountForRequest({
          authorisationStatus: "consumerNotFound",
        });
        return next();
      }

      // todo: consider notifying the caller that he cannot access privileged fields (due to possible compromised key)
      if (!apiConsumer.isAuthorized) {
        incTotalCountForRequest({
          authorisationStatus: "unauthorisedId",
          consumerName: apiConsumer.consumer,
        });
        return next();
      }

      if (apiConsumer.expirationDate < clock.now()) {
        incTotalCountForRequest({
          authorisationStatus: "expiredToken",
          consumerName: apiConsumer.consumer,
        });
        return next();
      }

      // only if the user is known, and the id authorized, and not expired we add apiConsumer payload to the request:
      incTotalCountForRequest({
        consumerName: apiConsumer.consumer,
        authorisationStatus: "authorised",
      });

      req.apiConsumer = apiConsumer;
      return next();
    } catch (_) {
      incTotalCountForRequest({
        authorisationStatus: "incorrectJwt",
      });
      return next();
    }
  };
};

const responseError = (res: Response, message: string, status = 403) =>
  res.status(status).json({ error: `forbidden: ${message}` });

export const createApiKeyAuthMiddlewareV1 = (
  getApiConsumerById: GetApiConsumerById,
  clock: Clock,
  config: AppConfig,
) => {
  const verifyJwt = makeVerifyJwtES256<WithApiConsumerId>(
    config.apiJwtPublicKey,
  );

  return async (req: Request, res: Response, next: NextFunction) => {
    const incTotalCountForRequest = createIncTotalCountForRequest(req);
    if (!req.headers.authorization) {
      incTotalCountForRequest({ authorisationStatus: "unauthenticated" });
      return responseError(res, "unauthenticated", 401);
    }

    try {
      const { id } = verifyJwt(req.headers.authorization);
      const apiConsumer = await getApiConsumerById(id);

      if (!apiConsumer) {
        incTotalCountForRequest({
          authorisationStatus: "consumerNotFound",
        });
        return responseError(res, "consumer not found");
      }

      if (!apiConsumer.isAuthorized) {
        incTotalCountForRequest({
          authorisationStatus: "unauthorisedId",
          consumerName: apiConsumer.consumer,
        });
        return responseError(res, "unauthorised consumer Id");
      }

      if (apiConsumer.expirationDate < clock.now()) {
        incTotalCountForRequest({
          authorisationStatus: "expiredToken",
          consumerName: apiConsumer.consumer,
        });
        return responseError(res, "expired token");
      }

      // only if the user is known, and the id authorized, and not expired we add apiConsumer payload to the request:
      incTotalCountForRequest({
        consumerName: apiConsumer.consumer,
        authorisationStatus: "authorised",
      });

      req.apiConsumer = apiConsumer;
      return next();
    } catch (_) {
      incTotalCountForRequest({
        authorisationStatus: "incorrectJwt",
      });
      return responseError(res, "incorrect Jwt", 401);
    }
  };
};

export const createMagicLinkAuthMiddleware = (
  config: AppConfig,
  payloadKey: PayloadKey,
) => {
  const { verifyJwt, verifyDeprecatedJwt } = verifyJwtConfig(config);

  return (req: Request, res: Response, next: NextFunction) => {
    const maybeJwt = req.headers.authorization;
    if (!maybeJwt) {
      return responseError(res, "unauthenticated", 401);
    }
    try {
      const payload = verifyJwt(maybeJwt);
      // TODO : check that if exp > now, it throws 401
      const currentJwtVersion = currentJwtVersions[payloadKey];

      if (!payload.version || payload.version < currentJwtVersion) {
        return sendNeedsRenewedLinkError(
          res,
          new TokenExpiredError(
            "Token corresponds to an old version, please renew",
            new Date(currentJwtVersions[payloadKey]),
          ),
        );
      }

      switch (payloadKey) {
        case "application":
          req.payloads = { application: payload as ConventionMagicLinkPayload };
          break;
        case "establishment":
          req.payloads = { establishment: payload as EstablishmentJwtPayload };
          break;
        default:
          // eslint-disable-next-line no-case-declarations
          const unhandledPayloadKey: never = payloadKey;
          throw new Error(
            "Should not happen. Expected payoaldKey, received : " +
              unhandledPayloadKey,
          );
      }

      next();
    } catch (err: any) {
      const unsafePayload = jwt.decode(maybeJwt) as ConventionMagicLinkPayload;
      if (err instanceof TokenExpiredError) {
        logger.warn(
          { token: maybeJwt, payload: unsafePayload },
          "token expired",
        );

        return unsafePayload
          ? sendNeedsRenewedLinkError(res, err)
          : sendAuthenticationError(res, err);
      }

      try {
        verifyDeprecatedJwt(maybeJwt);
        return sendNeedsRenewedLinkError(res, err);
      } catch (error: any) {
        return sendAuthenticationError(res, error);
      }
    }
  };
};

const sendAuthenticationError = (res: Response, err: Error) => {
  logger.error({ err }, "authentication failed");
  res.status(401);
  return res.json({
    error: "Provided token is invalid",
  });
};

const sendNeedsRenewedLinkError = (res: Response, err: Error) => {
  logger.info({ err }, "unsupported or expired magic link used");
  res.status(403);
  return res.json({
    message: "Le lien magique est périmé",
    needsNewMagicLink: true,
  });
};
export const verifyJwtConfig = (config: AppConfig) => {
  const verifyJwt = makeVerifyJwtES256<PayloadOption>(
    config.magicLinkJwtPublicKey,
  );

  const verifyDeprecatedJwt = config.magicLinkJwtPreviousPublicKey
    ? makeVerifyJwtES256<PayloadOption>(config.magicLinkJwtPreviousPublicKey)
    : () => {
        throw new Error("No deprecated JWT private key provided");
      };
  return { verifyJwt, verifyDeprecatedJwt };
};
