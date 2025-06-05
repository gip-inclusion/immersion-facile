import {
  type AbsoluteUrl,
  type ShareLinkByEmailDto,
  errors,
  shareLinkByEmailSchema,
} from "shared";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import { notifyToTeamAndThrowError } from "../../../utils/notifyTeam";
import { TransactionalUseCase } from "../../core/UseCase";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { makeShortLink } from "../../core/short-link/ShortLink";
import type { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

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
    throwErrorIfUrlNotFromIFDomain({
      url: params.conventionLink,
      expectedDomain: this.#config.immersionFacileDomain,
    });

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

const throwErrorIfUrlNotFromIFDomain = ({
  url,
  expectedDomain,
}: { url: string; expectedDomain: string }) => {
  const urlObj = new URL(url);
  if (!urlObj.hostname.endsWith(expectedDomain)) {
    notifyToTeamAndThrowError(errors.url.notFromIFDomain(url));
  }
};
