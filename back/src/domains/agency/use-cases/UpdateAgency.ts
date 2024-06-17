import { AgencyDto, InclusionConnectedUser, agencySchema } from "shared";
import { NotFoundError } from "../../../config/helpers/httpErrors";
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
    await uow.agencyRepository.update(agency).catch((error) => {
      if (error.message === `Agency ${agency.id} does not exist`) {
        throw new NotFoundError(`No agency found with id : ${agency.id}`);
      }
      throw error;
    });

    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "AgencyUpdated",
        payload: { agency },
      }),
    );
  }
}
