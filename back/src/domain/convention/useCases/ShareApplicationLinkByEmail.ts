import { ShareLinkByEmailDto, shareLinkByEmailSchema } from "shared";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../generic/notifications/entities/Notification";

export class ShareApplicationLinkByEmail extends TransactionalUseCase<ShareLinkByEmailDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
  }
  inputSchema = shareLinkByEmailSchema;

  public async _execute(
    params: ShareLinkByEmailDto,
    uow: UnitOfWork,
  ): Promise<void> {
    await this.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        type: "SHARE_DRAFT_CONVENTION_BY_LINK",
        recipients: [params.email],
        params: {
          internshipKind: params.internshipKind,
          additionalDetails: params.details,
          conventionFormUrl: params.conventionLink,
        },
      },
      followedIds: {},
    });
  }
}
