import {
  type ConnectedUser,
  errors,
  type RejectConnectedUserRoleForAgencyParams,
  rejectIcUserRoleForAgencyParamsSchema,
} from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfNotAdmin } from "../helpers/authorization.helper";

export class RejectUserForAgency extends TransactionalUseCase<
  RejectConnectedUserRoleForAgencyParams,
  void,
  ConnectedUser
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
    params: RejectConnectedUserRoleForAgencyParams,
    uow: UnitOfWork,
    currentUser: ConnectedUser,
  ): Promise<void> {
    throwIfNotAdmin(currentUser);
    const user = await uow.userRepository.getById(params.userId);

    if (!user) throw errors.user.notFound({ userId: params.userId });

    const agency = await uow.agencyRepository.getById(params.agencyId);

    if (!agency) throw errors.agency.notFound({ agencyId: params.agencyId });

    const { [user.id]: _, ...updatedUserRights } = agency.usersRights;

    await Promise.all([
      uow.agencyRepository.update({
        id: agency.id,
        usersRights: updatedUserRights,
      }),
      uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "ConnectedUserAgencyRightRejected",
          payload: {
            ...params,
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
