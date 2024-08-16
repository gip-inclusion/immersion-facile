import {
  RejectIcUserRoleForAgencyParams,
  errors,
  rejectIcUserRoleForAgencyParamsSchema,
} from "shared";
import { TransactionalUseCase } from "../../../core/UseCase";
import { oAuthModeByFeatureFlags } from "../../../core/authentication/inclusion-connect/port/OAuthGateway";
import { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class NotifyIcUserAgencyRightRejected extends TransactionalUseCase<
  RejectIcUserRoleForAgencyParams,
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
    params: RejectIcUserRoleForAgencyParams,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency = await uow.agencyRepository.getById(params.agencyId);

    if (!agency) throw errors.agency.notFound({ agencyId: params.agencyId });

    const user = await uow.userRepository.getById(
      params.userId,
      oAuthModeByFeatureFlags(await uow.featureFlagRepository.getAll()),
    );

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
