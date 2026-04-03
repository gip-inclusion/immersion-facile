import {
  type ConventionReadDto,
  cleanSpecialChars,
  sliceTextUpToBytesLimit,
} from "shared";
import { broadcastToFtServiceName } from "../../../core/saved-errors/ports/BroadcastFeedbacksRepository";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../../core/useCaseBuilder";
import {
  getLinkedAgencies,
  shouldBroadcastToFranceTravail,
} from "../../entities/Convention";
import {
  type FranceTravailGateway,
  isBroadcastResponseOk,
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
    const { agency, refersToAgency } = await getLinkedAgencies(
      uow,
      inputParams.convention,
    );

    const featureFlags = await uow.featureFlagQueries.getAll();

    if (
      !shouldBroadcastToFranceTravail({
        agency: agency,
        refersToAgency: refersToAgency,
        featureFlags,
      })
    )
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

    if (deps.options.resyncMode)
      await uow.conventionsToSyncRepository.save({
        id: inputParams.convention.id,
        status: "SUCCESS",
        processDate: deps.timeGateway.now(),
      });

    await uow.broadcastFeedbacksRepository.save({
      consumerId: null,
      consumerName: "France Travail",
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
