import { Router } from "express";
import {
  FeatureFlags,
  getImmersionOfferByIdRoute__v0,
  immersionOffersApiAuthRoute__v0,
  pipeWithValue,
  searchImmersionRoute__v0,
} from "shared";
import { counterFormEstablishmentCaller } from "../../../../utils/counters";
import { createLogger } from "../../../../utils/logger";
import { AppConfig } from "../../config/appConfig";
import type { AppDependencies } from "../../config/createAppDependencies";
import {
  ForbiddenError,
  UpgradeRequired,
  validateAndParseZodSchema,
} from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";
import { formEstablishmentDtoPublicV0ToDomain } from "../DtoAndSchemas/v0/input/FormEstablishmentPublicV0.dto";
import { formEstablishmentSchemaPublicV0 } from "../DtoAndSchemas/v0/input/FormEstablishmentPublicV0.schema";
import { searchImmersionRequestPublicV0ToDomain } from "../DtoAndSchemas/v0/input/SearchImmersionRequestPublicV0.dto";
import {
  domainToSearchImmersionResultPublicV0,
  LegacyImmersionOfferId,
  toGetSearchImmersionResultBySiretAndRomePayload,
} from "../DtoAndSchemas/v0/output/SearchImmersionResultPublicV0.dto";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const throwUpgradeRequiredIfEnableApiV0IsNotActive = async (
  getFeatureFlags: () => Promise<FeatureFlags>,
) => {
  const featureFlags = await getFeatureFlags();
  if (!featureFlags.enableApiV0.isActive) {
    throw new UpgradeRequired(
      `The V0 API is deprecated. Please use API V2 instead (documentation available at ${config.immersionFacileBaseUrl}/doc-api)`,
    );
  }
};

export const createApiKeyAuthRouter = (deps: AppDependencies) => {
  const authenticatedRouter = Router({ mergeParams: true });

  authenticatedRouter
    .route(`/${searchImmersionRoute__v0}`)
    .post(deps.apiKeyAuthMiddlewareV0, async (req, res) =>
      sendHttpResponse(req, res, async () => {
        await throwUpgradeRequiredIfEnableApiV0IsNotActive(() =>
          deps.useCases.getFeatureFlags.execute(),
        );
        return (
          await deps.useCases.searchImmersion.execute(
            searchImmersionRequestPublicV0ToDomain(req.body),
            req.apiConsumer,
          )
        ).map(domainToSearchImmersionResultPublicV0);
      }),
    );

  authenticatedRouter
    .route(`/${getImmersionOfferByIdRoute__v0}/:id`)
    .get(deps.apiKeyAuthMiddlewareV0, async (req, res) =>
      sendHttpResponse(req, res, async () => {
        await throwUpgradeRequiredIfEnableApiV0IsNotActive(() =>
          deps.useCases.getFeatureFlags.execute(),
        );
        return domainToSearchImmersionResultPublicV0(
          await deps.useCases.getSearchImmersionResultBySiretAndRome.execute(
            toGetSearchImmersionResultBySiretAndRomePayload(
              req.params.id as LegacyImmersionOfferId,
            ),
            req.apiConsumer,
          ),
        );
      }),
    );
  authenticatedRouter
    .route(`/${immersionOffersApiAuthRoute__v0}`)
    .post(deps.apiKeyAuthMiddlewareV0, async (req, res) => {
      await throwUpgradeRequiredIfEnableApiV0IsNotActive(() =>
        deps.useCases.getFeatureFlags.execute(),
      );
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
        if (!req.apiConsumer) {
          throw new ForbiddenError();
        }
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
