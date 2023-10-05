import { Router } from "express";
import { andThen, keys, map } from "ramda";
import { eventToRightName, isApiConsumerAllowed, pipeWithValue } from "shared";
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
import { conventionReadToConventionReadPublicV2 } from "../DtoAndSchemas/v2/input/ConventionReadPublicV2.dto";
import { getConventionsByFiltersV2ToDomain } from "../DtoAndSchemas/v2/input/GetConventionByFiltersQueriesV2.schema";
import { domainToSearchImmersionResultPublicV2 } from "../DtoAndSchemas/v2/output/SearchImmersionResultPublicV2.dto";
import {
  publicApiV2ConventionRoutes,
  publicApiV2SearchEstablishmentRoutes,
  publicApiV2WebhooksRoutes,
} from "./publicApiV2.routes";

const logger = createLogger(__filename);

export const createApiKeyAuthRouterV2 = (deps: AppDependencies) => {
  const v2ExpressRouter = Router({ mergeParams: true });

  const searchEstablishmentV2Router = createExpressSharedRouter(
    publicApiV2SearchEstablishmentRoutes,
    v2ExpressRouter,
  );

  const conventionV2Router = createExpressSharedRouter(
    publicApiV2ConventionRoutes,
    v2ExpressRouter,
  );

  const webhooksV2Router = createExpressSharedRouter(
    publicApiV2WebhooksRoutes,
    v2ExpressRouter,
  );

  searchEstablishmentV2Router.searchImmersion(
    deps.apiConsumerMiddleware,
    async (req, res) =>
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
          (searchImmersionRequest) =>
            deps.useCases.searchImmersion.execute(
              searchImmersionRequest,
              req.apiConsumer,
            ),
          andThen(map(domainToSearchImmersionResultPublicV2)),
        );
      }),
  );

  searchEstablishmentV2Router.getOfferBySiretAndAppellationCode(
    deps.apiConsumerMiddleware,
    (req, res) =>
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

  searchEstablishmentV2Router.contactEstablishment(
    deps.apiConsumerMiddleware,
    (req, res) =>
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

  conventionV2Router.getConventionById(deps.apiConsumerMiddleware, (req, res) =>
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
      return pipeWithValue(
        await deps.useCases.getConventionForApiConsumer.execute(
          {
            conventionId: req.params.conventionId,
          },
          req.apiConsumer,
        ),
        conventionReadToConventionReadPublicV2,
      );
    }),
  );

  conventionV2Router.getConventions(deps.apiConsumerMiddleware, (req, res) =>
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
      return pipeWithValue(
        await deps.useCases.getConventionsForApiConsumer.execute(
          getConventionsByFiltersV2ToDomain(req.query),
          req.apiConsumer,
        ),
        map(conventionReadToConventionReadPublicV2),
      );
    }),
  );

  webhooksV2Router.subscribeToWebhook(deps.apiConsumerMiddleware, (req, res) =>
    sendHttpResponseForApiV2(req, res.status(201), async () => {
      const event = req.body.subscribedEvent;
      const rightNeeded = eventToRightName(event);

      if (
        !isApiConsumerAllowed({
          apiConsumer: req.apiConsumer,
          rightName: rightNeeded,
          consumerKind: "SUBSCRIPTION",
        })
      ) {
        throw new ForbiddenError();
      }
      await deps.useCases.subscribeToWebhook.execute(req.body, req.apiConsumer);
    }),
  );

  webhooksV2Router.listActiveSubscriptions(
    deps.apiConsumerMiddleware,
    (req, res) =>
      sendHttpResponseForApiV2(req, res.status(200), async () => {
        const apiConsumer = req.apiConsumer;
        if (
          !apiConsumer ||
          (apiConsumer &&
            keys(apiConsumer.rights).filter((rightName) =>
              apiConsumer.rights[rightName].kinds.includes("SUBSCRIPTION"),
            ).length === 0)
        ) {
          throw new ForbiddenError();
        }
        return deps.useCases.listActiveSubscriptions.execute(
          undefined,
          apiConsumer,
        );
      }),
  );

  return v2ExpressRouter;
};
