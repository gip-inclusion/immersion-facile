import { NextFunction, Request, Response } from "express";
import { TokenExpiredError } from "jsonwebtoken";
import { MagicLinkPayload } from "../../shared/tokens/MagicLinkPayload";
import { createLogger } from "../../utils/logger";
import { makeVerifyJwt } from "./../../domain/auth/jwt";
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

export const createApiKeyAuthMiddleware = (config: AppConfig) => {
  const verifyJwt = makeVerifyJwt(config.jwtPublicKey);
  const authorizedIds = config.authorizedApiKeyIds;

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      apiKeyAuthMiddlewareRequestsTotal.inc({
        route: convertRouteToLog(req.originalUrl),
        method: req.method,
      });
      return next();
    }
    verifyJwt(
      req.headers.authorization as string,
      (err, apiConsumerPayload: ApiConsumer) => {
        if (err) {
          apiKeyAuthMiddlewareRequestsTotal.inc({
            route: req.route,
            method: req.method,
            consumerName: apiConsumerPayload.name,
            authorisationStatus: "incorrectJwt",
          });
          return next();
        }
        if (!authorizedIds.includes(apiConsumerPayload.id)) {
          apiKeyAuthMiddlewareRequestsTotal.inc({
            route: req.route,
            method: req.method,
            consumerName: apiConsumerPayload.name,
            authorisationStatus: "unauthorizedId",
          });
          return next();
        }

        apiKeyAuthMiddlewareRequestsTotal.inc({
          route: req.route,
          method: req.method,
          consumerName: apiConsumerPayload.name,
          authorisationStatus: "authorised",
        });

        // only if the user is known, and the id authorized, we add apiConsumer payload to the request:
        req.apiConsumer = apiConsumerPayload;
        return next();
      },
    );
  };
};

export const createJwtAuthMiddleware = (config: AppConfig) => {
  const verifyJwt = makeVerifyJwt(config.jwtPublicKey);

  return (req: Request, res: Response, next: NextFunction) => {
    const pathComponents = req.path.split("/");
    const maybeJwt = pathComponents[pathComponents.length - 1];
    if (!maybeJwt) {
      sendForbiddenError(res, new Error("impossible to authenticate"));
    }

    verifyJwt(maybeJwt as string, (err, payload) => {
      if (err) {
        if (err instanceof TokenExpiredError) {
          // Decode the payload without verifying it to extract the application id and role.
          const expiredPayload = jwt.decode(maybeJwt) as MagicLinkPayload;
          if (!expiredPayload) {
            sendForbiddenError(res, err);
          } else {
            sendNeedsRenewedLinkError(res, err);
          }

          return;
        }

        sendForbiddenError(res, err);
        return;
      }
      req.jwtPayload = payload as MagicLinkPayload;
      next();
    });
  };
};

const sendForbiddenError = (res: Response, err: Error) => {
  logger.error({ err }, "authentication failed");
  res.status(403);
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
