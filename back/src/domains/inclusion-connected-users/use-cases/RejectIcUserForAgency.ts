import {
  InclusionConnectedUser,
  RejectIcUserRoleForAgencyParams,
  errors,
  rejectIcUserRoleForAgencyParamsSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { makeProvider } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfNotAdmin } from "../helpers/authorization.helper";

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
    const provider = await makeProvider(uow);
    const user = await uow.userRepository.getById(params.userId, provider);

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
          topic: "IcUserAgencyRightRejected",
          payload: {
            ...params,
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
