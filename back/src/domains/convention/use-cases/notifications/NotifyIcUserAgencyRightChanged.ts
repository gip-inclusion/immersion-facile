import {
  errors,
  type WithAgencyIdAndUserId,
  withAgencyIdAndUserIdSchema,
} from "shared";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class NotifyIcUserAgencyRightChanged extends TransactionalUseCase<
  WithAgencyIdAndUserId,
  void
> {
  protected inputSchema = withAgencyIdAndUserIdSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  protected async _execute(
    params: WithAgencyIdAndUserId,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency = await uow.agencyRepository.getById(params.agencyId);
    if (!agency) throw errors.agency.notFound({ agencyId: params.agencyId });

    const user = await uow.userRepository.getById(params.userId);
    if (!user) throw errors.user.notFound({ userId: params.userId });

    const agencyRight = agency.usersRights[user.id];

    if (agencyRight && !agencyRight.roles.includes("to-review"))
      await this.#saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "IC_USER_RIGHTS_HAS_CHANGED",
          recipients: [user.email],
          params: {
            agencyName: agency.name,
            isNotifiedByEmail: agencyRight.isNotifiedByEmail,
            roles: agencyRight.roles,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          },
        },
        followedIds: {
          agencyId: agency.id,
          userId: user.id,
        },
      });
  }
}
