import {
  AgencyRight,
  IcUserRoleForAgencyParams,
  InclusionConnectDomainJwtPayload,
  icUserRoleForAgencyParamsSchema,
  replaceElementWhere,
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

export class UpdateIcUserRoleForAgency extends TransactionalUseCase<
  IcUserRoleForAgencyParams,
  void,
  InclusionConnectDomainJwtPayload
> {
  protected inputSchema = icUserRoleForAgencyParamsSchema;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);

    this.#createNewEvent = createNewEvent;
  }

  protected async _execute(
    params: IcUserRoleForAgencyParams,
    uow: UnitOfWork,
    jwtPayload: InclusionConnectDomainJwtPayload,
  ): Promise<void> {
    if (!jwtPayload) throw new ForbiddenError("No JWT token provided");

    await throwIfIcUserNotBackofficeAdmin(uow, jwtPayload);

    const userToUpdate = await uow.inclusionConnectedUserRepository.getById(
      params.userId,
    );
    if (!userToUpdate)
      throw new NotFoundError(`User with id ${params.userId} not found`);

    const agencyRightToUpdate = userToUpdate.agencyRights.find(
      ({ agency }) => agency.id === params.agencyId,
    );

    if (!agencyRightToUpdate)
      throw new NotFoundError(
        `Agency with id ${params.agencyId} is not registered for user with id ${params.userId}`,
      );

    const updatedAgencyRight: AgencyRight = {
      ...agencyRightToUpdate,
      roles: params.roles,
    };

    const newAgencyRights = replaceElementWhere(
      userToUpdate.agencyRights,
      updatedAgencyRight,
      ({ agency }) => agency.id === params.agencyId,
    );

    const event: DomainEvent = this.#createNewEvent({
      topic: "IcUserAgencyRightChanged",
      payload: params,
    });

    await Promise.all([
      uow.inclusionConnectedUserRepository.updateAgencyRights({
        userId: params.userId,
        agencyRights: newAgencyRights,
      }),
      uow.outboxRepository.save(event),
    ]);
  }
}
