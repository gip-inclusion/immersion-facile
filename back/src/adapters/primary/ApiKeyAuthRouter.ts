import { Router } from "express";
import promClient from "prom-client";
import {
  getImmersionOfferByIdRoute,
  immersionOffersRoute,
  searchImmersionRoute,
} from "../../shared/routes";
import { AppDependencies } from "./config";
import { sendHttpResponse } from "./helpers/sendHttpResponse";

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
    .route(`/${immersionOffersRoute}`)
    .post(async (req, res) => {
      counterFormEstablishmentCaller.inc({
        referer: req.get("Referrer"),
      });

      return sendHttpResponse(req, res, () =>
        deps.useCases.addFormEstablishment.execute(req.body),
      );
    });

  return authenticatedRouter;
};
