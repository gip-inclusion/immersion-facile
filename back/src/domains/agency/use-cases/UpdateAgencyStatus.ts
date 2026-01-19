import {
  type ConnectedUser,
  errors,
  type PartialAgencyDto,
  updateAgencyStatusParamsSchema,
} from "shared";
import { throwIfNotAdmin } from "../../connected-users/helpers/authorization.helper";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type UpdateAgencyStatus = ReturnType<typeof makeUpdateAgencyStatus>;
export const makeUpdateAgencyStatus = useCaseBuilder("UpdateAgencyStatus")
  .withInput(updateAgencyStatusParamsSchema)
  .withCurrentUser<ConnectedUser>()
  .withDeps<{ createNewEvent: CreateNewEvent; timeGateway: TimeGateway }>()
  .build(async ({ uow, currentUser, deps, inputParams }) => {
    throwIfNotAdmin(currentUser);
    const existingAgency = await uow.agencyRepository.getById(inputParams.id);
    if (!existingAgency)
      throw errors.agency.notFound({
        agencyId: inputParams.id,
      });

    const updatedAgencyParams: PartialAgencyDto = {
      id: inputParams.id,
      status: inputParams.status,
      statusJustification:
        inputParams.status === "rejected"
          ? inputParams.statusJustification
          : null,
    };
    const phoneId = await uow.phoneNumberRepository.getIdByPhoneNumber(
      existingAgency.phoneNumber,
      deps.timeGateway.now(),
    );
    await uow.agencyRepository.update({
      partialAgency: updatedAgencyParams,
      newPhoneId: phoneId,
    });

    if (inputParams.status === "active" || inputParams.status === "rejected") {
      await uow.outboxRepository.save(
        deps.createNewEvent({
          topic:
            inputParams.status === "active"
              ? "AgencyActivated"
              : "AgencyRejected",
          payload: {
            agencyId: existingAgency.id,
            triggeredBy: {
              kind: "connected-user",
              userId: currentUser.id,
            },
          },
        }),
      );
    }
  });
