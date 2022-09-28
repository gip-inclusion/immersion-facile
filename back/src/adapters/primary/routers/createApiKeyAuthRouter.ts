import { Router } from "express";
import promClient from "prom-client";
import { pipeWithValue } from "shared";
import {
  getImmersionOfferByIdRoute__v0,
  immersionOffersApiAuthRoute__v0,
  searchImmersionRoute__v0,
} from "shared";
import type { AppDependencies } from "../config/createAppDependencies";
import {
  ForbiddenError,
  validateAndParseZodSchema,
} from "../helpers/httpErrors";
import { sendHttpResponse } from "../helpers/sendHttpResponse";
import { formEstablishmentDtoPublicV0ToDomain } from "./DtoAndSchemas/v0/input/FormEstablishmentPublicV0.dto";
import { formEstablishmentSchemaPublicV0 } from "./DtoAndSchemas/v0/input/FormEstablishmentPublicV0.schema";
import { searchImmersionRequestPublicV0ToDomain } from "./DtoAndSchemas/v0/input/SearchImmersionRequestPublicV0.dto";
import { domainToSearchImmersionResultPublicV0 } from "./DtoAndSchemas/v0/output/SearchImmersionResultPublicV0.dto";

const counterFormEstablishmentCaller = new promClient.Counter({
  name: "form_establishment_callers_counter",
  help: "The total count form establishment adds, broken down by referer.",
  labelNames: ["referer"],
});

export const createApiKeyAuthRouter = (deps: AppDependencies) => {
  const authenticatedRouter = Router({ mergeParams: true });

  authenticatedRouter.use(deps.apiKeyAuthMiddlewareV0);

  authenticatedRouter
    .route(`/${searchImmersionRoute__v0}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, async () => {
        const searchImmersionRequest = searchImmersionRequestPublicV0ToDomain(
          req.body,
        );
        await deps.useCases.callLaBonneBoiteAndUpdateRepositories.execute(
          searchImmersionRequest,
        );
        return (
          await deps.useCases.searchImmersion.execute(
            searchImmersionRequest,
            req.apiConsumer,
          )
        ).map(domainToSearchImmersionResultPublicV0);
      }),
    );

  authenticatedRouter
    .route(`/${getImmersionOfferByIdRoute__v0}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        domainToSearchImmersionResultPublicV0(
          await deps.useCases.getImmersionOfferById.execute(
            req.params.id,
            req.apiConsumer,
          ),
        ),
      ),
    );
  authenticatedRouter
    .route(`/${immersionOffersApiAuthRoute__v0}`)
    .post(async (req, res) => {
      counterFormEstablishmentCaller.inc({
        referer: req.get("Referrer"),
      });

      return sendHttpResponse(req, res, () => {
        if (!req.apiConsumer?.isAuthorized) throw new ForbiddenError();

        return pipeWithValue(
          validateAndParseZodSchema(formEstablishmentSchemaPublicV0, {
            ...req.body,
            isSearchable: true,
          }),
          formEstablishmentDtoPublicV0ToDomain,
          (domainFormEstablishmentWithoutSource) =>
            deps.useCases.addFormEstablishment.execute({
              ...domainFormEstablishmentWithoutSource,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              source: req.apiConsumer!.consumer,
            }),
        );
      });
    });

  return authenticatedRouter;
};
