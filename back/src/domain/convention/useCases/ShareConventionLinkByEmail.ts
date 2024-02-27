import {
  AbsoluteUrl,
  ShareLinkByEmailDto,
  shareLinkByEmailSchema,
} from "shared";
import { AppConfig } from "../../../adapters/primary/config/appConfig";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { makeShortLink } from "../../core/short-link/ShortLink";
import { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { SaveNotificationAndRelatedEvent } from "../../generic/notifications/entities/Notification";

export class ShareConventionLinkByEmail extends TransactionalUseCase<ShareLinkByEmailDto> {
  protected inputSchema = shareLinkByEmailSchema;

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
    params: ShareLinkByEmailDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const shortLink = await makeShortLink({
      uow,
      longLink: params.conventionLink as AbsoluteUrl,
      shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
      config: this.#config,
    });
    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "SHARE_DRAFT_CONVENTION_BY_LINK",
        recipients: [params.email],
        params: {
          internshipKind: params.internshipKind,
          additionalDetails: params.details,
          conventionFormUrl: shortLink,
        },
      },
      followedIds: {},
    });
  }
}
