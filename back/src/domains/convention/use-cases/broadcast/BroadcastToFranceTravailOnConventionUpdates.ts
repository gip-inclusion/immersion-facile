import {
  type ConventionReadDto,
  cleanSpecialChars,
  sliceTextUpToBytesLimit,
} from "shared";
import { broadcastToFtServiceName } from "../../../core/saved-errors/ports/BroadcastFeedbacksRepository";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../../core/useCaseBuilder";
import {
  getLinkedAgenciesFromAgencyId,
  shouldBroadcastToFranceTravail,
} from "../../entities/Convention";
import {
  type FranceTravailGateway,
  isBroadcastResponseOk,
  isBroadcastTimeoutError,
} from "../../ports/FranceTravailGateway";
import {
  type BroadcastConventionParams,
  broadcastConventionParamsSchema,
} from "./broadcastConventionParams";

export type BroadcastToFranceTravailOnConventionUpdates = ReturnType<
  typeof makeBroadcastToFranceTravailOnConventionUpdates
>;
export const makeBroadcastToFranceTravailOnConventionUpdates = useCaseBuilder(
  "BroadcastToFranceTravailOnConventionUpdates",
)
  .withInput<BroadcastConventionParams>(broadcastConventionParamsSchema)
  .withDeps<{
    franceTravailGateway: FranceTravailGateway;
    timeGateway: TimeGateway;
    options: { resyncMode: boolean };
  }>()
  .build(async ({ inputParams, uow, deps }): Promise<void> => {
    const { agency, refersToAgency } = await getLinkedAgenciesFromAgencyId(
      uow,
      inputParams.convention.agencyId,
    );

    const featureFlags = await uow.featureFlagQueries.getAll();

    const shouldBroadcastForCurrentAgency = shouldBroadcastToFranceTravail({
      agency,
      refersToAgency,
      featureFlags,
    });

    const previousLinkedAgencies =
      inputParams.eventType === "CONVENTION_UPDATED" &&
      inputParams.previousAgencyId &&
      !shouldBroadcastForCurrentAgency
        ? await getLinkedAgenciesFromAgencyId(uow, inputParams.previousAgencyId)
        : undefined;

    const shouldBroadcastForPreviousAgency = previousLinkedAgencies
      ? shouldBroadcastToFranceTravail({
          agency: previousLinkedAgencies.agency,
          refersToAgency: previousLinkedAgencies.refersToAgency,
          featureFlags,
        })
      : false;

    const shouldBroadcast =
      shouldBroadcastForCurrentAgency || shouldBroadcastForPreviousAgency;

    if (!shouldBroadcast)
      return deps.options.resyncMode
        ? uow.conventionsToSyncRepository.save({
            id: inputParams.convention.id,
            status: "SKIP",
            processDate: deps.timeGateway.now(),
            reason: "Agency is not of kind pole-emploi",
          })
        : undefined;

    const response = await deps.franceTravailGateway.notifyOnConventionUpdated({
      ...inputParams,
      convention: makeFranceTravailSupportedConvention(inputParams.convention),
    });

    if (isBroadcastTimeoutError(response))
      await uow.conventionsToSyncRepository.save({
        id: inputParams.convention.id,
        status: "TO_PROCESS",
      });
    else if (deps.options.resyncMode && isBroadcastResponseOk(response))
      await uow.conventionsToSyncRepository.save({
        id: inputParams.convention.id,
        status: "SUCCESS",
        processDate: deps.timeGateway.now(),
      });

    await uow.broadcastFeedbacksRepository.save({
      consumerId: null,
      consumerName: "France Travail",
      conventionId: inputParams.convention.id,
      agencyId: inputParams.convention.agencyId,
      serviceName: broadcastToFtServiceName,
      requestParams: {
        conventionId: inputParams.convention.id,
        conventionStatus: inputParams.convention.status,
      },
      response: { httpStatus: response.status, body: response.body },
      occurredAt: deps.timeGateway.now().toISOString(),
      handledByAgency: false,
      ...(!isBroadcastResponseOk(response)
        ? { subscriberErrorFeedback: response.subscriberErrorFeedback }
        : {}),
    });
  });

const makeFranceTravailSupportedConvention = (
  convention: ConventionReadDto,
): ConventionReadDto => ({
  ...convention,
  establishmentTutor: {
    ...convention.establishmentTutor,
    job: sliceTextUpToBytesLimit(convention.establishmentTutor.job, 255),
  },
  sanitaryPreventionDescription: sliceTextUpToBytesLimit(
    cleanSpecialChars(convention.sanitaryPreventionDescription),
    255,
  ),
  individualProtectionDescription: sliceTextUpToBytesLimit(
    cleanSpecialChars(convention.individualProtectionDescription),
    255,
  ),
});
