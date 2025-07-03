import {
  type AgencyDto,
  agencySchema,
  type ConnectedUser,
  errors,
} from "shared";
import { throwIfNotAgencyAdminOrBackofficeAdmin } from "../../connected-users/helpers/authorization.helper";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class UpdateAgency extends TransactionalUseCase<
  AgencyDto,
  void,
  ConnectedUser
> {
  protected inputSchema = agencySchema;

  #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
  }

  public async _execute(
    agency: AgencyDto,
    uow: UnitOfWork,
    currentUser: ConnectedUser,
  ): Promise<void> {
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
        this.#createNewEvent({
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
  }
}
