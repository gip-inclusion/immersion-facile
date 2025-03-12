import { Router } from "express";
import { andThen, keys, map } from "ramda";
import {
  type ApiConsumer,
  type LocationId,
  type SearchQueryParamsDto,
  type SiretDto,
  type WithAcquisition,
  defaultPageInPagination,
  defaultPerPageInPagination,
  errors,
  eventToRightName,
  isApiConsumerAllowed,
  pipeWithValue,
} from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponseForApiV2 } from "../../../../config/helpers/sendHttpResponse";
import { validateAndParseZodSchemaV2 } from "../../../../config/helpers/validateAndParseZodSchema";
import type { UnitOfWorkPerformer } from "../../../../domains/core/unit-of-work/ports/UnitOfWorkPerformer";
import { createLogger } from "../../../../utils/logger";
import { contactEstablishmentPublicV2ToDomain } from "../DtoAndSchemas/v2/input/ContactEstablishmentPublicV2.dto";
import { contactEstablishmentPublicV2Schema } from "../DtoAndSchemas/v2/input/ContactEstablishmentPublicV2.schema";
import { conventionReadToConventionReadPublicV2 } from "../DtoAndSchemas/v2/input/ConventionReadPublicV2.dto";
import { getConventionsByFiltersV2ToDomain } from "../DtoAndSchemas/v2/input/GetConventionByFiltersQueriesV2.schema";
import { domainToSearchImmersionResultPublicV2 } from "../DtoAndSchemas/v2/output/SearchImmersionResultPublicV2.dto";
import {
  publicApiV2ConventionRoutes,
  publicApiV2SearchEstablishmentRoutes,
  publicApiV2StatisticsRoutes,
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

  const statisticsV2Router = createExpressSharedRouter(
    publicApiV2StatisticsRoutes,
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
          throw errors.apiConsumer.forbidden();
        return pipeWithValue(
          req.query,
          (searchImmersionRequest) => {
            const searchImmersionRequestWithSortedBy: SearchQueryParamsDto = {
              ...searchImmersionRequest,
              sortedBy: searchImmersionRequest.sortedBy ?? "distance",
            };
            return deps.useCases.searchImmersion.execute(
              searchImmersionRequestWithSortedBy,
              req.apiConsumer,
            );
          },
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
          throw errors.apiConsumer.forbidden();

        const locationId = await getFirstLocationIdOrThrow(
          deps.uowPerformer,
          req.params.siret,
        );

        return domainToSearchImmersionResultPublicV2(
          await deps.useCases.getSearchResultBySearchQuery.execute(
            {
              ...req.params,
              locationId,
            },
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
          throw errors.apiConsumer.forbidden();
        return pipeWithValue(
          validateAndParseZodSchemaV2(
            contactEstablishmentPublicV2Schema,
            req.body,
            logger,
          ),
          contactEstablishmentPublicV2ToDomain(() =>
            getFirstLocationIdOrThrow(deps.uowPerformer, req.body.siret),
          ),
          andThen((contactRequest) =>
            deps.useCases.legacyContactEstablishment.execute(
              addAcquisitionParams(contactRequest, req.apiConsumer),
            ),
          ),
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
      )
        throw errors.apiConsumer.forbidden();

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
      )
        throw errors.apiConsumer.forbidden();

      return pipeWithValue(
        await deps.useCases.getConventionsForApiConsumer.execute(
          getConventionsByFiltersV2ToDomain(req.query),
          req.apiConsumer,
        ),
        map(conventionReadToConventionReadPublicV2),
      );
    }),
  );

  statisticsV2Router.getEstablishmentStats(
    deps.apiConsumerMiddleware,
    (req, res) =>
      sendHttpResponseForApiV2(req, res, async () => {
        if (!req.apiConsumer) throw errors.user.unauthorized();

        const page = req.query.page ?? defaultPageInPagination;
        const perPage = req.query.perPage ?? defaultPerPageInPagination;

        return deps.useCases.getEstablishmentStats.execute(
          {
            page,
            perPage,
          },
          req.apiConsumer,
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
      )
        throw errors.apiConsumer.forbidden();

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
        )
          throw errors.apiConsumer.forbidden();

        return deps.useCases.listActiveSubscriptions.execute(
          undefined,
          apiConsumer,
        );
      }),
  );

  webhooksV2Router.unsubscribeToWebhook(
    deps.apiConsumerMiddleware,
    (req, res) =>
      sendHttpResponseForApiV2(req, res.status(204), async () => {
        await deps.useCases.deleteSubscription.execute(
          req.params.subscriptionId,
          req.apiConsumer,
        );
      }),
  );

  return v2ExpressRouter;
};

const getFirstLocationIdOrThrow = async (
  uowPerformer: UnitOfWorkPerformer,
  siret: SiretDto,
): Promise<LocationId> => {
  return uowPerformer.perform(async (uow) => {
    const aggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );

    if (!aggregate) throw errors.establishment.notFound({ siret });

    const firstLocationId = aggregate.establishment.locations.at(0)?.id;
    if (firstLocationId) {
      return firstLocationId;
    }

    throw errors.establishment.noLocation({ siret });
  });
};

const addAcquisitionParams = <T>(
  obj: T,
  apiConsumer: ApiConsumer | undefined,
): T & WithAcquisition => ({
  ...obj,
  ...(apiConsumer
    ? {
        acquisitionCampaign: "api-consumer",
        acquisitionKeyword: `${apiConsumer.id} - ${apiConsumer.name}`,
      }
    : {}),
});
