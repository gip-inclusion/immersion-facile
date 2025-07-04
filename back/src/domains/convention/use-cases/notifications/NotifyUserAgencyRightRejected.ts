import {
  errors,
  type RejectConnectedUserRoleForAgencyParams,
  rejectIcUserRoleForAgencyParamsSchema,
} from "shared";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class NotifyUserAgencyRightRejected extends TransactionalUseCase<
  RejectConnectedUserRoleForAgencyParams,
  void
> {
  protected inputSchema = rejectIcUserRoleForAgencyParamsSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  protected async _execute(
    params: RejectConnectedUserRoleForAgencyParams,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency = await uow.agencyRepository.getById(params.agencyId);

    if (!agency) throw errors.agency.notFound({ agencyId: params.agencyId });

    const user = await uow.userRepository.getById(params.userId);

    if (!user) throw errors.user.notFound({ userId: params.userId });

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "IC_USER_REGISTRATION_TO_AGENCY_REJECTED",
        params: {
          agencyName: agency.name,
          justification: params.justification,
        },
        recipients: [user.email],
      },
      followedIds: {
        agencyId: agency.id,
        userId: user.id,
      },
    });
  }
}
