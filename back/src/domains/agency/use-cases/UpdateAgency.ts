import {
  AgencyDto,
  Email,
  InclusionConnectedUser,
  agencySchema,
  errors,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfNotAdmin } from "../../inclusion-connected-users/helpers/throwIfIcUserNotBackofficeAdmin";

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
    throwIfNotAdmin(currentUser);
    const { validatorEmails, counsellorEmails, ...agencyToUpdate } = agency;

    this.#handleUpdatedValidatorAndCounsellorEmails(
      validatorEmails,
      counsellorEmails,
    );

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

  #handleUpdatedValidatorAndCounsellorEmails(
    _validatorEmails: Email[],
    _counsellorEmails: Email[],
  ): void {
    // Do nothing with updated emails
    // Agency rights and user creation is
    // no more the responsibility for agency update usecase
  }
}
