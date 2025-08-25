import { subDays } from "date-fns";
import {
  type AbsoluteUrl,
  type ConventionDto,
  type ConventionId,
  castError,
  frontRoutes,
  immersionFacileNoReplyEmailSender,
  localization,
  type SiretDto,
} from "shared";
import { z } from "zod";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
import { createLogger } from "../../../utils/logger";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { makeShortLink } from "../../core/short-link/ShortLink";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import {
  type EstablishmentLeadEventKind,
  establishmentLeadEventKind,
} from "../entities/EstablishmentLeadEntity";

const logger = createLogger(__filename);

export type SendEstablishmentLeadReminderOutput = {
  errors?: Record<SiretDto, Error>;
  establishmentsReminded: SiretDto[];
};

export type EstablishmentLeadReminderParams = {
  kind: EstablishmentLeadEventKind;
  beforeDate?: Date;
};

export class SendEstablishmentLeadReminderScript extends TransactionalUseCase<
  EstablishmentLeadReminderParams,
  SendEstablishmentLeadReminderOutput
> {
  protected inputSchema = z.object({
    kind: z.enum(establishmentLeadEventKind, {
      error: localization.invalidEnum,
    }),
    beforeDate: z.date().optional(),
  });

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #createNewEvent: CreateNewEvent;

  readonly #timeGateway: TimeGateway;

  readonly #shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;

  readonly #config: AppConfig;

  readonly #generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    createNewEvent: CreateNewEvent,
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway,
    config: AppConfig,
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#shortLinkIdGeneratorGateway = shortLinkIdGeneratorGateway;
    this.#config = config;
    this.#generateConventionMagicLinkUrl = generateConventionMagicLinkUrl;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    { kind, beforeDate }: EstablishmentLeadReminderParams,
    uow: UnitOfWork,
  ): Promise<SendEstablishmentLeadReminderOutput> {
    const tenDaysAgo = subDays(this.#timeGateway.now(), 10);
    const conventions =
      await uow.establishmentLeadQueries.getLastConventionsByUniqLastEventKind({
        conventionEndDateGreater: tenDaysAgo,
        kind,
        beforeDate,
        maxResults: 1000,
      });

    logger.info({ message: `processing ${conventions.length} conventions` });

    const errors: Record<ConventionId, Error> = {};
    await Promise.all(
      conventions.map(async (convention) => {
        await this.#sendOneEmailWithEstablishmentLeadReminder(
          uow,
          this.#config,
          convention,
        ).catch((error) => {
          errors[convention.id] = castError(error);
        });
      }),
    );

    return {
      establishmentsReminded: conventions.map(({ siret }) => siret),
      errors,
    };
  }

  async #sendOneEmailWithEstablishmentLeadReminder(
    uow: UnitOfWork,
    config: AppConfig,
    convention: ConventionDto,
  ) {
    const now = this.#timeGateway.now();
    const registerEstablishmentShortLink = await makeShortLink({
      uow,
      shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
      config: this.#config,
      longLink: generateAddEstablishmentFormLink({
        config,
        convention,
        acquisitionCampaign: "transactionnel-etablissement-rappel-inscription",
      }),
    });

    const unsubscribeToEmailLink = this.#generateConventionMagicLinkUrl({
      id: convention.id,
      email: convention.signatories.establishmentRepresentative.email,
      role: "establishment-representative",
      targetRoute: frontRoutes.unsubscribeEstablishmentLead,
      now,
    });

    const unsubscribeToEmailShortLink = await makeShortLink({
      uow,
      shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
      config: this.#config,
      longLink: unsubscribeToEmailLink,
    });

    const notification = await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "ESTABLISHMENT_LEAD_REMINDER",
        recipients: [convention.signatories.establishmentRepresentative.email],
        sender: immersionFacileNoReplyEmailSender,
        params: {
          businessName: convention.businessName,
          registerEstablishmentShortLink,
          unsubscribeToEmailShortLink,
        },
      },
      followedIds: {
        conventionId: convention.id,
        establishmentSiret: convention.siret,
      },
    });

    const establishmentLead = await uow.establishmentLeadRepository.getBySiret(
      convention.siret,
    );

    if (establishmentLead) {
      await uow.establishmentLeadRepository.save({
        ...establishmentLead,
        events: [
          ...establishmentLead.events,
          {
            kind: "reminder-sent",
            occurredAt: now,
            notification: { kind: notification.kind, id: notification.id },
          },
        ],
      });
    }

    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "EstablishmentLeadReminderSent",
        payload: { id: convention.id },
      }),
    );
  }
}

const generateAddEstablishmentFormLink = ({
  config,
  convention,
  acquisitionCampaign,
}: {
  config: AppConfig;
  convention: ConventionDto;
  acquisitionCampaign: string;
}): AbsoluteUrl =>
  `${config.immersionFacileBaseUrl}/${frontRoutes.establishment}?siret=${convention.siret}&bcLastName=${convention.signatories.establishmentRepresentative.lastName}&bcFirstName=${convention.signatories.establishmentRepresentative.firstName}&bcPhone=${convention.signatories.establishmentRepresentative.phone}&bcEmail=${convention.signatories.establishmentRepresentative.email}&mtm_campaign=${acquisitionCampaign}`;
