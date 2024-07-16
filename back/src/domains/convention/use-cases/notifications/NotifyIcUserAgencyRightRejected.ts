import {
  RejectIcUserRoleForAgencyParams,
  rejectIcUserRoleForAgencyParamsSchema,
} from "shared";
import { NotFoundError } from "shared";
import { TransactionalUseCase } from "../../../core/UseCase";
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

    if (!agency)
      throw new NotFoundError(
        `No agency were found with id: ${params.agencyId}`,
      );

    const user = await uow.inclusionConnectedUserRepository.getById(
      params.userId,
    );

    if (!user)
      throw new NotFoundError(`No user were found with id: ${params.userId}`);

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
