import { Router } from "express";
import promClient from "prom-client";
import {
  getImmersionOfferByIdRoute,
  searchImmersionRoute,
  immersionOffersApiAuthRoute,
} from "../../../shared/routes";
import { AppDependencies } from "../config";
import { sendHttpResponse } from "../helpers/sendHttpResponse";
import { ForbiddenError } from "../helpers/httpErrors";

const counterFormEstablishmentCaller = new promClient.Counter({
  name: "form_establishment_callers_counter",
  help: "The total count form establishment adds, broken down by referer.",
  labelNames: ["referer"],
});

export const createApiKeyAuthRouter = (deps: AppDependencies) => {
  const authenticatedRouter = Router({ mergeParams: true });

  authenticatedRouter.use(deps.apiKeyAuthMiddleware);

  authenticatedRouter.route(`/${searchImmersionRoute}`).post(async (req, res) =>
    sendHttpResponse(req, res, async () => {
      await deps.useCases.callLaBonneBoiteAndUpdateRepositories.execute(
        req.body,
      );
      return deps.useCases.searchImmersion.execute(req.body, req.apiConsumer);
    }),
  );

  authenticatedRouter
    .route(`/${getImmersionOfferByIdRoute}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getImmersionOfferById.execute(
          req.params.id,
          req.apiConsumer,
        ),
      ),
    );

  authenticatedRouter
    .route(`/${immersionOffersApiAuthRoute}`)
    .post(async (req, res) => {
      counterFormEstablishmentCaller.inc({
        referer: req.get("Referrer"),
      });

      return sendHttpResponse(req, res, () => {
        if (!req.apiConsumer?.isAuthorized) throw new ForbiddenError();
        return deps.useCases.addFormEstablishment.execute({
          ...req.body,
          source: req.apiConsumer.consumer,
        });
      });
    });

  return authenticatedRouter;
};
