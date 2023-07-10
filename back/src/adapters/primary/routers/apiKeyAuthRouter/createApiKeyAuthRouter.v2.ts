import { Router } from "express";
import {
  contactEstablishmentRoute,
  immersionOffersRoute,
  pipeWithValue,
  SiretAndAppellationDto,
} from "shared";
import { createLogger } from "../../../../utils/logger";
import type { AppDependencies } from "../../config/createAppDependencies";
import {
  ForbiddenError,
  validateAndParseZodSchema,
} from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";
import { contactEstablishmentPublicV2ToDomain } from "../DtoAndSchemas/v2/input/ContactEstablishmentPublicV2.dto";
import { contactEstablishmentPublicV2Schema } from "../DtoAndSchemas/v2/input/ContactEstablishmentPublicV2.schema";
import { searchImmersionRequestPublicV2ToDomain } from "../DtoAndSchemas/v2/input/SearchImmersionRequestPublicV2.dto";
import { domainToSearchImmersionResultPublicV2 } from "../DtoAndSchemas/v2/output/SearchImmersionResultPublicV2.dto";

const logger = createLogger(__filename);

export const createApiKeyAuthRouterV2 = (deps: AppDependencies) => {
  const publicV2Router = Router({ mergeParams: true });

  publicV2Router.use(deps.apiKeyAuthMiddleware);

  publicV2Router.route(`/${immersionOffersRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, async () => {
      const searchImmersionRequest = searchImmersionRequestPublicV2ToDomain(
        req.query as any,
      );
      const searchImmersionResultDtos =
        await deps.useCases.searchImmersion.execute(
          searchImmersionRequest,
          req.apiConsumer,
        );
      return searchImmersionResultDtos.map(
        domainToSearchImmersionResultPublicV2,
      );
    }),
  );

  publicV2Router
    .route(`/${immersionOffersRoute}/:siret/:appellationCode`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () => {
        if (!req.apiConsumer?.isAuthorized) throw new ForbiddenError();
        return domainToSearchImmersionResultPublicV2(
          await deps.useCases.getSearchImmersionResultBySiretAndAppellationCode.execute(
            {
              siret: req.params.siret,
              appellationCode: req.params.appellationCode,
            } as SiretAndAppellationDto,
            req.apiConsumer,
          ),
        );
      }),
    );

  publicV2Router.route(`/${contactEstablishmentRoute}`).post(async (req, res) =>
    sendHttpResponse(req, res, () => {
      if (!req.apiConsumer?.isAuthorized) throw new ForbiddenError();
      return pipeWithValue(
        validateAndParseZodSchema(
          contactEstablishmentPublicV2Schema,
          req.body,
          logger,
        ),
        contactEstablishmentPublicV2ToDomain,
        (contactRequest) =>
          deps.useCases.contactEstablishment.execute(contactRequest),
      );
    }),
  );

  return publicV2Router;
};
