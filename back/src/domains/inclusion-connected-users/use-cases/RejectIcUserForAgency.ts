import {
  InclusionConnectedUser,
  RejectIcUserRoleForAgencyParams,
  rejectIcUserRoleForAgencyParamsSchema,
} from "shared";
import { NotFoundError } from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { DomainEvent } from "../../core/events/events";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfNotAdmin } from "../helpers/throwIfIcUserNotBackofficeAdmin";

export class RejectIcUserForAgency extends TransactionalUseCase<
  RejectIcUserRoleForAgencyParams,
  void,
  InclusionConnectedUser
> {
  protected inputSchema = rejectIcUserRoleForAgencyParamsSchema;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);

    this.#createNewEvent = createNewEvent;
  }

  protected async _execute(
    params: RejectIcUserRoleForAgencyParams,
    uow: UnitOfWork,
    currentUser: InclusionConnectedUser,
  ): Promise<void> {
    throwIfNotAdmin(currentUser);

    const icUser = await uow.inclusionConnectedUserRepository.getById(
      params.userId,
    );

    if (!icUser)
      throw new NotFoundError(`No user found with id: ${params.userId}`);

    const agency = await uow.agencyRepository.getById(params.agencyId);

    if (!agency)
      throw new NotFoundError(`No agency found with id: ${params.agencyId}`);

    const updatedAgencyRights = icUser.agencyRights.filter(
      (agencyRight) => agencyRight.agency.id !== params.agencyId,
    );

    const event: DomainEvent = this.#createNewEvent({
      topic: "IcUserAgencyRightRejected",
      payload: params,
    });

    await Promise.all([
      uow.inclusionConnectedUserRepository.updateAgencyRights({
        userId: icUser.id,
        agencyRights: updatedAgencyRights,
      }),
      uow.outboxRepository.save(event),
    ]);
  }
}
