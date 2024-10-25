import {
  WithAgencyIdAndUserId,
  errors,
  withAgencyIdAndUserIdSchema,
} from "shared";
import { TransactionalUseCase } from "../../../core/UseCase";
import { oAuthProviderByFeatureFlags } from "../../../core/authentication/inclusion-connect/port/OAuthGateway";
import { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

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

    const user = await uow.userRepository.getById(
      params.userId,
      oAuthProviderByFeatureFlags(await uow.featureFlagRepository.getAll()),
    );
    if (!user) throw errors.user.notFound({ userId: params.userId });

    const agencyRight = user.agencyRights.find(
      (agencyRight) => agencyRight.agency.id === params.agencyId,
    );

    if (!agencyRight) throw errors.user.noRightsOnAgency(params);

    if (!agencyRight.roles.includes("to-review"))
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
