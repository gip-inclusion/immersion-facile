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
  MagicLinkPayload,
  PayloadKey,
  PayloadOption,
} from "../../shared/tokens/MagicLinkPayload";
import { createLogger } from "../../utils/logger";
import { makeVerifyJwt } from "../../domain/auth/jwt";
import { AppConfig } from "./appConfig";
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

export const createApiKeyAuthMiddleware = (
  getApiConsumerById: GetApiConsumerById,
  clock: Clock,
  config: AppConfig,
) => {
  const verifyJwt = makeVerifyJwt<WithApiConsumerId>(config.apiJwtPublicKey);

  return async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (err) {
      incTotalCountForRequest({
        authorisationStatus: "incorrectJwt",
      });
      return next();
    }
  };
};

export const createJwtAuthMiddleware = (
  config: AppConfig,
  payloadKey: PayloadKey,
) => {
  const { verifyJwt, verifyDeprecatedJwt } = verifyJwtConfig(config);

  return (req: Request, res: Response, next: NextFunction) => {
    const pathComponents = req.path.split("/");
    const maybeJwt = pathComponents[pathComponents.length - 1];
    if (!maybeJwt) {
      sendAuthenticationError(res, new Error("impossible to authenticate"));
    }

    try {
      const payload = verifyJwt(maybeJwt as string); // TODO : check that if exp > now, it throws 401
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
          req.payloads = { application: payload as MagicLinkPayload };
          break;
        case "establishment":
          req.payloads = { establishment: payload as EstablishmentJwtPayload };
          break;
        default:
          const neverAssigned: never = payloadKey;
          throw new Error("Should not happen.");
      }

      next();
    } catch (err: any) {
      const unsafePayload = jwt.decode(maybeJwt) as MagicLinkPayload;
      if (err instanceof TokenExpiredError) {
        return unsafePayload
          ? sendNeedsRenewedLinkError(res, err)
          : sendAuthenticationError(res, err);
      }

      try {
        verifyDeprecatedJwt(maybeJwt);
        return sendNeedsRenewedLinkError(res, err);
      } catch (deprecatedError: any) {
        return sendAuthenticationError(res, deprecatedError);
      }
    }
  };
};

const sendAuthenticationError = (res: Response, err: Error) => {
  logger.error({ err }, "authentication failed");
  res.status(401);
  return res.json({
    message: "Provided token is invalid",
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
  const verifyJwt = makeVerifyJwt<PayloadOption>(config.magicLinkJwtPublicKey);

  const verifyDeprecatedJwt = config.magicLinkJwtPreviousPublicKey
    ? makeVerifyJwt<PayloadOption>(config.magicLinkJwtPreviousPublicKey)
    : () => {
        throw new Error("No deprecated JWT private key provided");
      };
  return { verifyJwt, verifyDeprecatedJwt };
};
