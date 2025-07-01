import {
  type AgencyDto,
  agencySchema,
  errors,
  type InclusionConnectedUser,
} from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfNotAgencyAdminOrBackofficeAdmin } from "../../inclusion-connected-users/helpers/authorization.helper";

export class UpdateAgency extends TransactionalUseCase<
  AgencyDto,
  void,
  InclusionConnectedUser
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
    currentUser: InclusionConnectedUser,
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
              kind: "inclusion-connected",
              userId: currentUser.id,
            },
          },
        }),
      ),
    ]);
  }
}
