import { Router } from "express";
import {
  contactEstablishmentRoute,
  establishmentTargets,
  immersionOffersRoute,
  pipeWithValue,
  SiretAndRomeDto,
} from "shared";
import { counterFormEstablishmentCallerV1 } from "../../../../utils/counters";
import { createLogger } from "../../../../utils/logger";
import type { AppDependencies } from "../../config/createAppDependencies";
import {
  ForbiddenError,
  validateAndParseZodSchema,
} from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";
import { formEstablishmentDtoPublicV1ToDomain } from "../DtoAndSchemas/v1/input/FormEstablishmentPublicV1.dto";
import { formEstablishmentPublicV1Schema } from "../DtoAndSchemas/v1/input/FormEstablishmentPublicV1.schema";
import { searchImmersionRequestPublicV1ToDomain } from "../DtoAndSchemas/v1/input/SearchImmersionRequestPublicV1dto";
import { domainToSearchImmersionResultPublicV1 } from "../DtoAndSchemas/v1/output/SearchImmersionResultPublicV1.dto";

const logger = createLogger(__filename);

export const createApiKeyAuthRouterV1 = (deps: AppDependencies) => {
  const publicV1Router = Router({ mergeParams: true });

  publicV1Router.use(deps.apiKeyAuthMiddleware);

  // Form establishments routes
  publicV1Router
    .route(establishmentTargets.addFormEstablishment.url)
    .post(async (req, res) => {
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
        if (!req.apiConsumer?.isAuthorized) throw new ForbiddenError();

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
  publicV1Router.route(`/${immersionOffersRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, async () => {
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

  publicV1Router.route(`/${contactEstablishmentRoute}`).post(async (req, res) =>
    sendHttpResponse(req, res, async () => {
      if (!req.apiConsumer?.isAuthorized) throw new ForbiddenError();
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
