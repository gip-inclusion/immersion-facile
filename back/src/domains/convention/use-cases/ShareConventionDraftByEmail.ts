import {
  type AbsoluteUrl,
  frontRoutes,
  type ShareConventionDraftByEmailDto,
  shareConventionDraftByEmailSchema,
} from "shared";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { makeShortLink } from "../../core/short-link/ShortLink";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class ShareConventionLinkByEmail extends TransactionalUseCase<ShareConventionDraftByEmailDto> {
  protected inputSchema = shareConventionDraftByEmailSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;

  readonly #timeGateway: TimeGateway;

  readonly #config: AppConfig;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway,
    timeGateway: TimeGateway,
    config: AppConfig,
  ) {
    super(uowPerformer);
    this.#config = config;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#shortLinkIdGeneratorGateway = shortLinkIdGeneratorGateway;
    this.#timeGateway = timeGateway;
  }

  public async _execute(
    params: ShareConventionDraftByEmailDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const now = this.#timeGateway.now().toISOString();
    await uow.conventionDraftRepository.save(params.conventionDraft, now);

    const shortLink = await makeShortLink({
      uow,
      longLink:
        `${this.#config.immersionFacileBaseUrl}/${params.conventionDraft.internshipKind === "immersion" ? frontRoutes.conventionImmersionRoute : frontRoutes.conventionMiniStageRoute}?conventionDraftId=${params.conventionDraft.id}` as AbsoluteUrl,
      shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
      config: this.#config,
    });

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "SHARE_CONVENTION_DRAFT_SELF",
        recipients: [params.senderEmail],
        params: {
          conventionFormUrl: shortLink,
          internshipKind: params.conventionDraft.internshipKind,
        },
      },
      followedIds: {},
    });

    if (params.recipientEmail) {
      await this.#saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "SHARE_CONVENTION_DRAFT_RECIPIENT",
          recipients: [params.recipientEmail],
          params: {
            additionalDetails: params.details,
            conventionFormUrl: shortLink,
            internshipKind: params.conventionDraft.internshipKind,
          },
        },
        followedIds: {},
      });
    }
  }
}
