import { NextFunction, Request, Response } from "express";
import { TokenExpiredError } from "jsonwebtoken";
import { MagicLinkPayload } from "../../shared/tokens/MagicLinkPayload";
import { createLogger } from "../../utils/logger";
import { makeVerifyJwt } from "../../domain/auth/jwt";
import { AppConfig } from "./appConfig";
import jwt from "jsonwebtoken";
import { ApiConsumer } from "../../shared/tokens/ApiConsumer";
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
  consumerName?: ApiConsumer["consumer"];
  authorisationStatus:
    | "authorised"
    | "unauthorisedId"
    | "incorrectJwt"
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

export const createApiKeyAuthMiddleware = (config: AppConfig) => {
  const verifyJwt = makeVerifyJwt<ApiConsumer>(config.jwtPublicKey);
  const authorizedIds = config.authorizedApiKeyIds;

  return (req: Request, res: Response, next: NextFunction) => {
    const incTotalCountForRequest = createIncTotalCountForRequest(req);

    if (!req.headers.authorization) {
      incTotalCountForRequest({ authorisationStatus: "unauthenticated" });
      return next();
    }

    try {
      const apiConsumerPayload = verifyJwt(req.headers.authorization as string);

      // todo: consider notifying the caller that he cannot access privileged fields (due to possible compromised key)
      if (!authorizedIds.includes(apiConsumerPayload.id)) {
        incTotalCountForRequest({
          authorisationStatus: "unauthorisedId",
          consumerName: apiConsumerPayload.consumer,
        });
        return next();
      }

      // only if the user is known, and the id authorized, we add apiConsumer payload to the request:
      incTotalCountForRequest({
        consumerName: apiConsumerPayload.consumer,
        authorisationStatus: "authorised",
      });

      req.apiConsumer = apiConsumerPayload;
      return next();
    } catch (err) {
      incTotalCountForRequest({
        authorisationStatus: "incorrectJwt",
      });
      return next();
    }
  };
};

export const createJwtAuthMiddleware = (config: AppConfig) => {
  const { verifyJwt, verifyDeprecatedJwt } = verifyJwtConfig(config);

  return (req: Request, res: Response, next: NextFunction) => {
    const pathComponents = req.path.split("/");
    const maybeJwt = pathComponents[pathComponents.length - 1];
    if (!maybeJwt) {
      sendAuthenticationError(res, new Error("impossible to authenticate"));
    }

    try {
      const payload = verifyJwt(maybeJwt as string);
      req.jwtPayload = payload;
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
export function verifyJwtConfig(config: AppConfig) {
  const verifyJwt = makeVerifyJwt<MagicLinkPayload>(config.jwtPublicKey);

  const verifyDeprecatedJwt = config.jwtPreviousPublicKey
    ? makeVerifyJwt<MagicLinkPayload>(config.jwtPreviousPublicKey)
    : () => {
        throw new Error("No deprecated JWT private key provided");
      };
  return { verifyJwt, verifyDeprecatedJwt };
}
