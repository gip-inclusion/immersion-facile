import { Router } from "express";
import promClient from "prom-client";
import {
  formEstablishmentsRoute,
  immersionOffersRoute,
  pipeWithValue,
  SiretAndRomeDto,
} from "shared";
import type { AppDependencies } from "../config/createAppDependencies";
import {
  ForbiddenError,
  validateAndParseZodSchema,
} from "../helpers/httpErrors";
import { sendHttpResponse } from "../helpers/sendHttpResponse";
import { formEstablishmentDtoPublicV1ToDomain } from "./DtoAndSchemas/v1/input/FormEstablishmentPublicV1.dto";
import { formEstablishmentPublicV1Schema } from "./DtoAndSchemas/v1/input/FormEstablishmentPublicV1.schema";
import { domainToSearchImmersionResultPublicV1 } from "./DtoAndSchemas/v1/output/SearchImmersionResultPublicV1.dto";

const counterFormEstablishmentCaller = new promClient.Counter({
  name: "form_establishment_v1_callers_counter",
  help: "The total count form establishment adds, broken down by referer.",
  labelNames: ["referer"],
});

export const createApiKeyAuthRouterV1 = (deps: AppDependencies) => {
  const publicV1Router = Router({ mergeParams: true });

  publicV1Router.use(deps.apiKeyAuthMiddleware);

  // Form establishments routes
  publicV1Router.route(`/${formEstablishmentsRoute}`).post(async (req, res) => {
    counterFormEstablishmentCaller.inc({
      referer: req.get("Referrer"),
    });
    return sendHttpResponse(req, res, () => {
      if (!req.apiConsumer?.isAuthorized) throw new ForbiddenError();

      return pipeWithValue(
        validateAndParseZodSchema(formEstablishmentPublicV1Schema, req.body),
        formEstablishmentDtoPublicV1ToDomain,
        (domainFormEstablishmentWithoutSource) =>
          deps.useCases.addFormEstablishment.execute({
            ...domainFormEstablishmentWithoutSource,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            source: req.apiConsumer!.consumer,
          }),
      );
    });
  });

  // Immersion offers routes
  publicV1Router.route(`/${immersionOffersRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, async () => {
      await deps.useCases.callLaBonneBoiteAndUpdateRepositories.execute(
        req.query as any,
      );
      const searchImmersionResultDtos =
        await deps.useCases.searchImmersion.execute(
          req.query as any,
          req.apiConsumer,
        );
      return searchImmersionResultDtos.map(
        domainToSearchImmersionResultPublicV1,
      );
    }),
  );
  publicV1Router
    .route(`/${immersionOffersRoute}/:siret/:rome`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () => {
        if (!req.apiConsumer?.isAuthorized) throw new ForbiddenError();
        return domainToSearchImmersionResultPublicV1(
          await deps.useCases.getImmersionOfferBySiretAndRome.execute(
            {
              siret: req.params.siret,
              rome: req.params.rome,
            } as SiretAndRomeDto,
            req.apiConsumer,
          ),
        );
      }),
    );
  return publicV1Router;
};
