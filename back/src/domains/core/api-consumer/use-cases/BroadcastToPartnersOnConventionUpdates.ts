import { filter } from "ramda";
import {
  type ApiConsumer,
  type AppellationAndRomeDto,
  type ConventionReadDto,
  errors,
  isApiConsumerAllowed,
  pipeWithValue,
  type WithConventionId,
  withConventionIdSchema,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import { assesmentEntityToConventionAssessmentFields } from "../../../../utils/convention";
import { createLogger } from "../../../../utils/logger";
import { broadcastToPartnersServiceName } from "../../saved-errors/ports/BroadcastFeedbacksRepository";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../useCaseBuilder";
import { getReferedAgency } from "../helpers/agency";
import type { SubscribersGateway } from "../ports/SubscribersGateway";

const logger = createLogger(__filename);

const debugDoubleBroadcastMessage = (message: string) =>
  `Debug Mission Local, message en double. ${message}`;

const isConsumerSubscribedToConventionUpdated = (apiConsumer: ApiConsumer) => {
  const conventionUpdatedCallbackParams =
    apiConsumer.rights.convention.subscriptions.find(
      (sub) => sub.subscribedEvent === "convention.updated",
    );
  return !!conventionUpdatedCallbackParams;
};

const getImmersionAppellation = async ({
  uow,
  conventionRead,
  apiConsumer,
  consumerNamesUsingRomeV3,
}: {
  uow: UnitOfWork;
  conventionRead: ConventionReadDto;
  apiConsumer: ApiConsumer;
  consumerNamesUsingRomeV3: string[];
}): Promise<AppellationAndRomeDto> => {
  if (consumerNamesUsingRomeV3.includes(apiConsumer.name)) {
    const appellationAndRome =
      await uow.romeRepository.getAppellationAndRomeLegacyV3(
        conventionRead.immersionAppellation.appellationCode,
      );

    if (appellationAndRome) return appellationAndRome;
  }

  return conventionRead.immersionAppellation;
};

const notifySubscriber = ({
  uow,
  conventionRead,
  deps,
}: {
  uow: UnitOfWork;
  conventionRead: ConventionReadDto;
  deps: {
    subscribersGateway: SubscribersGateway;
    timeGateway: TimeGateway;
    consumerNamesUsingRomeV3: string[];
  };
}) => {
  return async (apiConsumer: ApiConsumer) => {
    const immersionAppellation = await getImmersionAppellation({
      uow,
      conventionRead,
      apiConsumer,
      consumerNamesUsingRomeV3: deps.consumerNamesUsingRomeV3,
    });

    const conventionUpdatedCallbackParams =
      apiConsumer.rights.convention.subscriptions.find(
        (sub) => sub.subscribedEvent === "convention.updated",
      );

    if (!conventionUpdatedCallbackParams) {
      throw errors.apiConsumer.missingCallbackParams({
        conventionId: conventionRead.id,
        consumerId: apiConsumer.id,
      });
    }

    const convention = {
      ...conventionRead,
      immersionAppellation,
    };

    if (conventionRead.agencyKind === "mission-locale") {
      logger.warn({
        message: debugDoubleBroadcastMessage("About to broadcast convention"),
        conventionId: convention.id,
      });
    }

    const response = await deps.subscribersGateway.notify(
      {
        payload: { convention },
        subscribedEvent: "convention.updated",
      },
      {
        callbackUrl: conventionUpdatedCallbackParams.callbackUrl,
        callbackHeaders: conventionUpdatedCallbackParams.callbackHeaders,
      },
    );

    if (response.title === "Partner subscription errored") {
      logger.error({ subscriberResponse: response });

      await uow.broadcastFeedbacksRepository.save({
        consumerId: apiConsumer.id,
        consumerName: apiConsumer.name,
        handledByAgency: false,
        subscriberErrorFeedback: response.subscriberErrorFeedback,
        occurredAt: deps.timeGateway.now().toISOString(),
        requestParams: {
          callbackUrl: response.callbackUrl,
          conventionId: response.conventionId,
          conventionStatus: response.conventionStatus,
        },
        serviceName: broadcastToPartnersServiceName,
        ...(response.status
          ? { response: { httpStatus: response.status, body: response.body } }
          : {}),
      });

      return;
    }

    await uow.broadcastFeedbacksRepository.save({
      consumerId: apiConsumer.id,
      consumerName: apiConsumer.name,
      handledByAgency: false,
      occurredAt: deps.timeGateway.now().toISOString(),
      requestParams: {
        callbackUrl: response.callbackUrl,
        conventionId: response.conventionId,
        conventionStatus: response.conventionStatus,
      },
      ...(response.status
        ? { response: { httpStatus: response.status, body: response.body } }
        : {}),
      serviceName: broadcastToPartnersServiceName,
    });

    logger.info({ subscriberResponse: response });
  };
};

export type BroadcastToPartnersOnConventionUpdates = ReturnType<
  typeof makeBroadcastToPartnersOnConventionUpdates
>;

export const makeBroadcastToPartnersOnConventionUpdates = useCaseBuilder(
  "BroadcastToPartnersOnConventionUpdates",
)
  .withInput<WithConventionId>(withConventionIdSchema)
  .withDeps<{
    subscribersGateway: SubscribersGateway;
    timeGateway: TimeGateway;
    consumerNamesUsingRomeV3: string[];
  }>()
  .build(async ({ inputParams, uow, deps }) => {
    const { conventionId } = inputParams;
    const convention = await uow.conventionRepository.getById(conventionId);
    if (!convention) throw errors.convention.notFound({ conventionId });

    const agencyWithRights = await uow.agencyRepository.getById(
      convention.agencyId,
    );
    if (!agencyWithRights)
      throw errors.agency.notFound({ agencyId: convention.agencyId });

    const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);
    const {
      acquisitionCampaign: _,
      acquisitionKeyword: __,
      ...conventionWithoutAcquisitionParams
    } = convention;

    const assessment = await uow.assessmentRepository.getByConventionId(
      convention.id,
    );

    const assessmentFields =
      assesmentEntityToConventionAssessmentFields(assessment);

    const conventionRead: ConventionReadDto = {
      ...conventionWithoutAcquisitionParams,
      agencyName: agencyWithRights.name,
      agencyContactEmail: agencyWithRights.contactEmail,
      agencyDepartment: agencyWithRights.address.departmentCode,
      agencyKind: agencyWithRights.kind,
      agencySiret: agencyWithRights.agencySiret,
      agencyRefersTo: agencyWithRights.refersToAgencyId
        ? await getReferedAgency(uow, agencyWithRights.refersToAgencyId)
        : undefined,
      agencyCounsellorEmails: agency.counsellorEmails,
      agencyValidatorEmails: agency.validatorEmails,
      ...assessmentFields,
    };

    const apiConsumers = pipeWithValue(
      await uow.apiConsumerRepository.getByFilters({
        agencyIds: [
          conventionRead.agencyId,
          ...(conventionRead.agencyRefersTo
            ? [conventionRead.agencyRefersTo.id]
            : []),
        ],
        agencyKinds: [
          conventionRead.agencyKind,
          ...(conventionRead.agencyRefersTo
            ? [conventionRead.agencyRefersTo.kind]
            : []),
        ],
      }),
      filter<ApiConsumer>(
        (apiConsumer) =>
          isApiConsumerAllowed({
            apiConsumer,
            rightName: "convention",
            consumerKind: "SUBSCRIPTION",
          }) && isConsumerSubscribedToConventionUpdated(apiConsumer),
      ),
    );

    if (agencyWithRights.kind === "mission-locale") {
      logger.warn({
        message: debugDoubleBroadcastMessage(
          `apiConsumers.length: ${apiConsumers.length}. ${apiConsumers.length > 1 ? JSON.stringify(apiConsumers) : ""}`,
        ),
        conventionId: convention.id,
      });
    }

    await Promise.all(
      apiConsumers.map(notifySubscriber({ uow, conventionRead, deps })),
    );
  });
