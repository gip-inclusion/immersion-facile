import {
  InclusionConnectJwtPayload,
  InclusionConnectedUser,
  RejectIcUserRoleForAgencyParams,
  rejectIcUserRoleForAgencyParamsSchema,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { DomainEvent } from "../../core/events/events";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfIcUserNotBackofficeAdmin } from "../helpers/throwIfIcUserNotBackofficeAdmin";

export class RejectIcUserForAgency extends TransactionalUseCase<
  RejectIcUserRoleForAgencyParams,
  void,
  InclusionConnectJwtPayload
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
    jwtPayload: InclusionConnectJwtPayload,
  ): Promise<void> {
    if (!jwtPayload) throw new ForbiddenError("No JWT token provided");

    await throwIfIcUserNotBackofficeAdmin(uow, jwtPayload);

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

    const updatedIcUser: InclusionConnectedUser = {
      ...icUser,
      agencyRights: updatedAgencyRights,
    };

    const event: DomainEvent = this.#createNewEvent({
      topic: "IcUserAgencyRightRejected",
      payload: params,
    });

    await Promise.all([
      uow.inclusionConnectedUserRepository.updateAgencyRights(updatedIcUser),
      uow.outboxRepository.save(event),
    ]);
  }
}
