import {
  InclusionConnectedUser,
  RejectIcUserRoleForAgencyParams,
  errors,
  rejectIcUserRoleForAgencyParamsSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { oAuthProviderByFeatureFlags } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
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

    const icUser = await uow.userRepository.getById(
      params.userId,
      oAuthProviderByFeatureFlags(await uow.featureFlagRepository.getAll()),
    );

    if (!icUser) throw errors.user.notFound({ userId: params.userId });

    const agency = await uow.agencyRepository.getById(params.agencyId);

    if (!agency) throw errors.agency.notFound({ agencyId: params.agencyId });

    const updatedAgencyRights = icUser.agencyRights.filter(
      (agencyRight) => agencyRight.agency.id !== params.agencyId,
    );

    const event: DomainEvent = this.#createNewEvent({
      topic: "IcUserAgencyRightRejected",
      payload: {
        ...params,
        triggeredBy: {
          kind: "inclusion-connected",
          userId: currentUser.id,
        },
      },
    });

    await Promise.all([
      uow.userRepository.updateAgencyRights({
        userId: icUser.id,
        agencyRights: updatedAgencyRights,
      }),
      uow.outboxRepository.save(event),
    ]);
  }
}
