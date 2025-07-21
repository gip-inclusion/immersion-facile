import { agencySchema, type ConnectedUser, errors } from "shared";
import { throwIfNotAgencyAdminOrBackofficeAdmin } from "../../connected-users/helpers/authorization.helper";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type UpdateAgency = ReturnType<typeof makeUpdateAgency>;
export const makeUpdateAgency = useCaseBuilder("UpdateAgency")
  .withInput(agencySchema)
  .withCurrentUser<ConnectedUser>()
  .withDeps<{ createNewEvent: CreateNewEvent }>()
  .build(async ({ uow, currentUser, deps, inputParams: agency }) => {
    throwIfNotAgencyAdminOrBackofficeAdmin(agency.id, currentUser);

    const {
      validatorEmails: _,
      counsellorEmails: __,
      ...agencyToUpdate
    } = agency;

    await Promise.all([
      uow.agencyRepository.update(agencyToUpdate).catch((error) => {
        if (error.message === `Agency ${agency.id} does not exist`)
          throw errors.agency.notFound({ agencyId: agency.id });
        throw error;
      }),
      uow.outboxRepository.save(
        deps.createNewEvent({
          topic: "AgencyUpdated",
          payload: {
            agencyId: agency.id,
            triggeredBy: {
              kind: "connected-user",
              userId: currentUser.id,
            },
          },
        }),
      ),
    ]);
  });
