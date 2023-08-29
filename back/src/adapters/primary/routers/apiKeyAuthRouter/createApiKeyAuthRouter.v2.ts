import { Router } from "express";
import { andThen, map } from "ramda";
import { pipeWithValue } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import { createLogger } from "../../../../utils/logger";
import type { AppDependencies } from "../../config/createAppDependencies";
import {
  ForbiddenError,
  validateAndParseZodSchemaV2,
} from "../../helpers/httpErrors";
import { sendHttpResponseForApiV2 } from "../../helpers/sendHttpResponse";
import { contactEstablishmentPublicV2ToDomain } from "../DtoAndSchemas/v2/input/ContactEstablishmentPublicV2.dto";
import { contactEstablishmentPublicV2Schema } from "../DtoAndSchemas/v2/input/ContactEstablishmentPublicV2.schema";
import { searchParamsPublicV2ToDomain } from "../DtoAndSchemas/v2/input/SearchParamsPublicV2.dto";
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

  publicV2SharedRouter.searchImmersion((req, res) =>
    sendHttpResponseForApiV2(req, res, async () =>
      pipeWithValue(
        req.query,
        searchParamsPublicV2ToDomain,
        (searchImmersionRequest) =>
          deps.useCases.searchImmersion.execute(
            searchImmersionRequest,
            req.apiConsumer,
          ),
        andThen(map(domainToSearchImmersionResultPublicV2)),
      ),
    ),
  );

  publicV2SharedRouter.getOfferBySiretAndAppellationCode((req, res) =>
    sendHttpResponseForApiV2(req, res, async () => {
      if (!req.apiConsumer?.isAuthorized) throw new ForbiddenError();
      return domainToSearchImmersionResultPublicV2(
        await deps.useCases.getSearchResultBySiretAndAppellationCode.execute(
          req.params,
          req.apiConsumer,
        ),
      );
    }),
  );

  publicV2SharedRouter.contactEstablishment((req, res) =>
    sendHttpResponseForApiV2(req, res.status(201), () => {
      if (!req.apiConsumer?.isAuthorized) throw new ForbiddenError();
      return pipeWithValue(
        validateAndParseZodSchemaV2(
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
