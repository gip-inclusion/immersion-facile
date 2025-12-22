import type { ShareConventionDraftByEmailDto } from "shared/src/convention/shareConventionDraftByEmail.dto";
import { shareConventionDraftByEmailSchema } from "shared/src/convention/shareConventionDraftByEmail.schema";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class ShareConventionLinkByEmail extends TransactionalUseCase<ShareConventionDraftByEmailDto> {
  protected inputSchema = shareConventionDraftByEmailSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;

  readonly #config: AppConfig;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway,
    config: AppConfig,
  ) {
    super(uowPerformer);
    this.#config = config;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#shortLinkIdGeneratorGateway = shortLinkIdGeneratorGateway;
  }

  public async _execute(
    params: ShareConventionDraftByEmailDto,
    uow: UnitOfWork,
  ): Promise<void> {
    // const shortLink = await makeShortLink({
    //   uow,
    //   longLink: params.conventionLink as AbsoluteUrl,
    //   shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
    //   config: this.#config,
    // });

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "SHARE_DRAFT_CONVENTION_BY_LINK",
        recipients: [params.senderEmail],
        params: {
          additionalDetails: params.details,
          conventionFormUrl: "",
          internshipKind: "immersion",
        },
      },
      followedIds: {},
    });
  }
}
