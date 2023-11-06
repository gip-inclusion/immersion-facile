import { Router } from "express";
import {
  contactEstablishmentRoute,
  establishmentRoutes,
  FeatureFlags,
  immersionOffersRoute,
  pipeWithValue,
  SiretAndAppellationDto,
} from "shared";
import { counterFormEstablishmentCallerV1 } from "../../../../utils/counters";
import { createLogger } from "../../../../utils/logger";
import { AppConfig } from "../../config/appConfig";
import type { AppDependencies } from "../../config/createAppDependencies";
import {
  ForbiddenError,
  UpgradeRequired,
  validateAndParseZodSchema,
} from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";
import { formEstablishmentDtoPublicV1ToDomain } from "../DtoAndSchemas/v1/input/FormEstablishmentPublicV1.dto";
import { formEstablishmentPublicV1Schema } from "../DtoAndSchemas/v1/input/FormEstablishmentPublicV1.schema";
import { searchImmersionRequestPublicV1ToDomain } from "../DtoAndSchemas/v1/input/SearchImmersionRequestPublicV1dto";
import { domainToSearchImmersionResultPublicV1 } from "../DtoAndSchemas/v1/output/SearchImmersionResultPublicV1.dto";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const throwUpgradeRequiredIfEnableApiV1IsNotActive = async (
  getFeatureFlags: () => Promise<FeatureFlags>,
) => {
  const featureFlags = await getFeatureFlags();
  if (!featureFlags.enableApiV1.isActive) {
    throw new UpgradeRequired(
      `The V1 API is deprecated. Please use API V2 instead (documentation available at ${config.immersionFacileBaseUrl}/doc-api)`,
    );
  }
};

export const createApiKeyAuthRouterV1 = (deps: AppDependencies) => {
  const publicV1Router = Router({ mergeParams: true });

  // Form establishments routes
  publicV1Router
    .route(`/v1${establishmentRoutes.addFormEstablishment.url}`)
    .post(deps.apiKeyAuthMiddlewareV1, async (req, res) => {
      await throwUpgradeRequiredIfEnableApiV1IsNotActive(() =>
        deps.useCases.getFeatureFlags.execute(),
      );
      counterFormEstablishmentCallerV1.inc({
        referer: req.get("Referrer"),
      });
      logger.info(
        {
          referer: req.get("Referrer"),
        },
        "formEstablishmentCallerV1",
      );
      return sendHttpResponse(req, res, () => {
        if (!req.apiConsumer) {
          throw new ForbiddenError();
        }

        return pipeWithValue(
          validateAndParseZodSchema(
            formEstablishmentPublicV1Schema,
            req.body,
            logger,
          ),
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
  publicV1Router
    .route(`/v1/${immersionOffersRoute}`)
    .get(deps.apiKeyAuthMiddlewareV1, async (req, res) =>
      sendHttpResponse(req, res, async () => {
        await throwUpgradeRequiredIfEnableApiV1IsNotActive(() =>
          deps.useCases.getFeatureFlags.execute(),
        );
        const searchImmersionRequest = searchImmersionRequestPublicV1ToDomain(
          req.query as any,
        );
        const searchImmersionResultDtos =
          await deps.useCases.searchImmersion.execute(
            searchImmersionRequest,
            req.apiConsumer,
          );
        return searchImmersionResultDtos.map(
          domainToSearchImmersionResultPublicV1,
        );
      }),
    );

  publicV1Router
    .route(`/v1/${immersionOffersRoute}/:siret/:rome`)
    .get(deps.apiKeyAuthMiddlewareV1, async (req, res) =>
      sendHttpResponse(req, res, async () => {
        await throwUpgradeRequiredIfEnableApiV1IsNotActive(() =>
          deps.useCases.getFeatureFlags.execute(),
        );
        const appellationCode =
          await deps.useCases.convertRomeToAppellationForEstablishment.execute({
            siret: req.params.siret,
            rome: req.params.rome,
          });

        return domainToSearchImmersionResultPublicV1(
          await deps.useCases.getSearchResultBySiretAndAppellationCode.execute(
            {
              siret: req.params.siret,
              appellationCode,
            } as SiretAndAppellationDto,
            req.apiConsumer,
          ),
        );
      }),
    );

  publicV1Router
    .route(`/v1/${contactEstablishmentRoute}`)
    .post(deps.apiKeyAuthMiddlewareV1, async (req, res) =>
      sendHttpResponse(req, res, async () => {
        if (!req.apiConsumer) {
          throw new ForbiddenError();
        }
        return pipeWithValue(
          await deps.useCases.convertContactEstablishmentPublicV1ToDomain.execute(
            req.body,
          ),
          (contactRequest) =>
            deps.useCases.contactEstablishment.execute(contactRequest),
        );
      }),
    );

  return publicV1Router;
};
