import { Router } from "express";
import { pipeWithValue, SiretAndAppellationDto } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
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
import { publicApiV2Routes } from "./publicApiV2.routes";

const logger = createLogger(__filename);

export const createApiKeyAuthRouterV2 = (deps: AppDependencies) => {
  const publicV2Router = Router({ mergeParams: true });

  publicV2Router.use("/v2", deps.apiKeyAuthMiddlewareV2);

  const publicV2SharedRouter = createExpressSharedRouter(
    publicApiV2Routes,
    publicV2Router,
  );

  publicV2SharedRouter.searchImmersion(async (req, res) =>
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

  publicV2SharedRouter.getOfferBySiretAndAppellationCode(async (req, res) =>
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

  publicV2SharedRouter.contactEstablishment(async (req, res) =>
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
