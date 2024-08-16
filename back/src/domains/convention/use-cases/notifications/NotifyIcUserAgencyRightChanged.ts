import { UserParamsForAgency, errors, userParamsForAgencySchema } from "shared";
import { TransactionalUseCase } from "../../../core/UseCase";
import { oAuthModeByFeatureFlags } from "../../../core/authentication/inclusion-connect/port/OAuthGateway";
import { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class NotifyIcUserAgencyRightChanged extends TransactionalUseCase<
  UserParamsForAgency,
  void
> {
  protected inputSchema = userParamsForAgencySchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  protected async _execute(
    params: UserParamsForAgency,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency = await uow.agencyRepository.getById(params.agencyId);
    if (!agency) throw errors.agency.notFound({ agencyId: params.agencyId });

    const user = await uow.userRepository.getById(
      params.userId,
      oAuthModeByFeatureFlags(await uow.featureFlagRepository.getAll()),
    );
    if (!user) throw errors.user.notFound({ userId: params.userId });

    if (!params.roles.includes("to-review"))
      await this.#saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "IC_USER_RIGHTS_HAS_CHANGED",
          recipients: [user.email],
          params: {
            agencyName: agency.name,
          },
        },
        followedIds: {
          agencyId: agency.id,
          userId: user.id,
        },
      });
  }
}
