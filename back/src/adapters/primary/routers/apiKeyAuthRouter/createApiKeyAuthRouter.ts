import { Router } from "express";
import {
  getImmersionOfferByIdRoute__v0,
  immersionOffersApiAuthRoute__v0,
  pipeWithValue,
  searchImmersionRoute__v0,
} from "shared";
import { counterFormEstablishmentCaller } from "../../../../utils/counters";
import { createLogger } from "../../../../utils/logger";
import type { AppDependencies } from "../../config/createAppDependencies";
import {
  ForbiddenError,
  validateAndParseZodSchema,
} from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";
import { formEstablishmentDtoPublicV0ToDomain } from "../DtoAndSchemas/v0/input/FormEstablishmentPublicV0.dto";
import { formEstablishmentSchemaPublicV0 } from "../DtoAndSchemas/v0/input/FormEstablishmentPublicV0.schema";
import { searchImmersionRequestPublicV0ToDomain } from "../DtoAndSchemas/v0/input/SearchImmersionRequestPublicV0.dto";
import { domainToSearchImmersionResultPublicV0 } from "../DtoAndSchemas/v0/output/SearchImmersionResultPublicV0.dto";

const logger = createLogger(__filename);

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
      logger.info(
        {
          referer: req.get("Referrer"),
        },
        "formEstablishmentCaller",
      );

      return sendHttpResponse(req, res, () => {
        if (!req.apiConsumer?.isAuthorized) throw new ForbiddenError();

        return pipeWithValue(
          validateAndParseZodSchema(
            formEstablishmentSchemaPublicV0,
            {
              ...req.body,
              isSearchable: true,
            },
            logger,
          ),
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
