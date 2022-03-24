import { Router } from "express";
import promClient from "prom-client";
import {
  getImmersionOfferByIdRoute,
  searchImmersionRoute,
  immersionOffersApiAuthRoute,
} from "../../../shared/routes";
import { AppDependencies } from "../config";
import { sendHttpResponse } from "../helpers/sendHttpResponse";
import {
  ForbiddenError,
  validateAndParseZodSchema,
} from "../helpers/httpErrors";
import { formEstablishmentDtoPublicV0ToDomain } from "./DtoAndSchemas/v0/input/FormEstablishmentPublicV0.dto";
import { formEstablishmentSchemaPublicV0 } from "./DtoAndSchemas/v0/input/FormEstablishmentPublicV0.schema";
import { pipeWithValue } from "../../../shared/pipeWithValue";

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

        return pipeWithValue(
          validateAndParseZodSchema(formEstablishmentSchemaPublicV0, req.body),
          formEstablishmentDtoPublicV0ToDomain,
          (domainFormEstablishmentWithoutSource) =>
            deps.useCases.addFormEstablishment.execute({
              ...domainFormEstablishmentWithoutSource,
              source: req.apiConsumer!.consumer,
            }),
        );
      });
    });

  return authenticatedRouter;
};
