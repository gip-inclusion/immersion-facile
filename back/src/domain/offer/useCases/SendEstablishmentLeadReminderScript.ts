import {
  AbsoluteUrl,
  ConventionId,
  ConventionReadDto,
  SiretDto,
  castError,
  frontRoutes,
  immersionFacileNoReplyEmailSender,
} from "shared";
import { z } from "zod";
import { AppConfig } from "../../../adapters/primary/config/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../adapters/primary/config/magicLinkUrl";
import { makeShortLink } from "../../core/ShortLink";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { ShortLinkIdGeneratorGateway } from "../../core/ports/ShortLinkIdGeneratorGateway";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { SaveNotificationAndRelatedEvent } from "../../generic/notifications/entities/Notification";
import {
  EstablishmentLeadEventKind,
  establishmentLeadEventKind,
} from "../entities/EstablishmentLeadEntity";

type SendEstablishmentLeadReminderOutput = {
  errors?: Record<SiretDto, Error>;
  establishmentsReminded: SiretDto[];
};

export class SendEstablishmentLeadReminderScript extends TransactionalUseCase<
  EstablishmentLeadEventKind,
  SendEstablishmentLeadReminderOutput
> {
  protected inputSchema = z.enum(establishmentLeadEventKind);

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
    _kind: EstablishmentLeadEventKind,
    uow: UnitOfWork,
  ): Promise<SendEstablishmentLeadReminderOutput> {
    const conventions =
      await uow.establishmentLeadQueries.getLastConventionsByLastEventKind(
        "to-be-reminded",
      );

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
    convention: ConventionReadDto,
  ) {
    const now = this.#timeGateway.now();
    const registerEstablishmentShortLink = await makeShortLink({
      uow,
      shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
      config: this.#config,
      longLink: generateAddEstablishmentFormLink({ config, convention }),
    });

    const unsubscribeToEmailLink = this.#generateConventionMagicLinkUrl({
      id: convention.id,
      email: convention.signatories.establishmentRepresentative.email,
      role: "establishment-representative",
      targetRoute: frontRoutes.unregisterEstablishmentLead,
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
        topic: "SendEstablishmentLeadReminder",
        payload: { id: convention.id },
      }),
    );
  }
}

const generateAddEstablishmentFormLink = ({
  config,
  convention,
}: { config: AppConfig; convention: ConventionReadDto }): AbsoluteUrl =>
  `${config.immersionFacileBaseUrl}/${frontRoutes.establishment}?siret=${convention.siret}&bcLastName=${convention.signatories.establishmentRepresentative.lastName}&bcFirstName=${convention.signatories.establishmentRepresentative.firstName}&bcPhone=${convention.signatories.establishmentRepresentative.phone}&bcEmail=${convention.signatories.establishmentRepresentative.email}`;