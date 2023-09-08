import { Router } from "express";
import { andThen, map } from "ramda";
import { isApiConsumerAllowed, pipeWithValue } from "shared";
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
import { getConventionsByFiltersV2ToDomain } from "../DtoAndSchemas/v2/input/GetConventionByFiltersQueriesV2.schema";
import { searchParamsPublicV2ToDomain } from "../DtoAndSchemas/v2/input/SearchParamsPublicV2.dto";
import { domainToSearchImmersionResultPublicV2 } from "../DtoAndSchemas/v2/output/SearchImmersionResultPublicV2.dto";
import {
  publicApiV2ConventionRoutes,
  publicApiV2SearchEstablishmentRoutes,
} from "./publicApiV2.routes";

const logger = createLogger(__filename);

export const createApiKeyAuthRouterV2 = (deps: AppDependencies) => {
  const v2ExpressRouter = Router({ mergeParams: true });

  v2ExpressRouter.use("/v2", deps.apiConsumerMiddleware);

  const searchEstablishmentV2Router = createExpressSharedRouter(
    publicApiV2SearchEstablishmentRoutes,
    v2ExpressRouter,
  );

  const conventionV2Router = createExpressSharedRouter(
    publicApiV2ConventionRoutes,
    v2ExpressRouter,
  );

  searchEstablishmentV2Router.searchImmersion((req, res) =>
    sendHttpResponseForApiV2(req, res, async () => {
      if (
        !isApiConsumerAllowed({
          apiConsumer: req.apiConsumer,
          rightName: "searchEstablishment",
          consumerKind: "READ",
        })
      )
        throw new ForbiddenError();
      return pipeWithValue(
        req.query,
        searchParamsPublicV2ToDomain,
        (searchImmersionRequest) =>
          deps.useCases.searchImmersion.execute(
            searchImmersionRequest,
            req.apiConsumer,
          ),
        andThen(map(domainToSearchImmersionResultPublicV2)),
      );
    }),
  );

  searchEstablishmentV2Router.getOfferBySiretAndAppellationCode((req, res) =>
    sendHttpResponseForApiV2(req, res, async () => {
      if (
        !isApiConsumerAllowed({
          apiConsumer: req.apiConsumer,
          rightName: "searchEstablishment",
          consumerKind: "READ",
        })
      )
        throw new ForbiddenError();
      return domainToSearchImmersionResultPublicV2(
        await deps.useCases.getSearchResultBySiretAndAppellationCode.execute(
          req.params,
          req.apiConsumer,
        ),
      );
    }),
  );

  searchEstablishmentV2Router.contactEstablishment((req, res) =>
    sendHttpResponseForApiV2(req, res.status(201), () => {
      if (
        !isApiConsumerAllowed({
          apiConsumer: req.apiConsumer,
          rightName: "searchEstablishment",
          consumerKind: "READ",
        })
      )
        throw new ForbiddenError();
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

  conventionV2Router.getConventionById((req, res) =>
    sendHttpResponseForApiV2(req, res, async () =>
      deps.useCases.getConventionForApiConsumer.execute(
        {
          conventionId: req.params.conventionId,
        },
        req.apiConsumer,
      ),
    ),
  );

  conventionV2Router.getConventions((req, res) =>
    sendHttpResponseForApiV2(req, res, async () => {
      if (
        !isApiConsumerAllowed({
          apiConsumer: req.apiConsumer,
          rightName: "convention",
          consumerKind: "READ",
        })
      ) {
        throw new ForbiddenError();
      }
      return deps.useCases.getConventionsForApiConsumer.execute(
        getConventionsByFiltersV2ToDomain(req.query),
        req.apiConsumer,
      );
    }),
  );

  return v2ExpressRouter;
};
