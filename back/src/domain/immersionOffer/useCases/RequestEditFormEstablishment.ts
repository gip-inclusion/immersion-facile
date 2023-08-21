import subDays from "date-fns/subDays";
import {
  addressDtoToString,
  createEstablishmentJwtPayload,
  Email,
  SiretDto,
  siretSchema,
} from "shared";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { GenerateEditFormEstablishmentJwt } from "../../auth/jwt";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../generic/notifications/entities/Notification";
import { NotificationRepository } from "../../generic/notifications/ports/NotificationRepository";

export class RequestEditFormEstablishment extends TransactionalUseCase<SiretDto> {
  protected inputSchema = siretSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #timeGateway: TimeGateway;

  readonly #generateEditFormEstablishmentUrl: GenerateEditFormEstablishmentJwt;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    timeGateway: TimeGateway,
    generateEditFormEstablishmentUrl: GenerateEditFormEstablishmentJwt,
  ) {
    super(uowPerformer);

    this.#generateEditFormEstablishmentUrl = generateEditFormEstablishmentUrl;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(siret: SiretDto, uow: UnitOfWork) {
    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );

    if (!establishmentAggregate) throw Error("Etablissement introuvable.");

    const { contact, establishment } = establishmentAggregate;

    if (!contact) throw Error("Email du contact introuvable.");

    const now = this.#timeGateway.now();

    await this.#throwIfMailToEditEstablishmentWasSentRecently(
      uow.notificationRepository,
      contact.email,
      now,
    );

    const payload = createEstablishmentJwtPayload({
      siret,
      now,
      durationDays: 1,
    });

    const editFrontUrl = this.#generateEditFormEstablishmentUrl(payload);

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "EDIT_FORM_ESTABLISHMENT_LINK",
        recipients: [contact.email],
        cc: contact.copyEmails,
        params: {
          editFrontUrl,
          businessName: establishment.customizedName ?? establishment.name,
          businessAddress: addressDtoToString(establishment.address),
        },
      },
      followedIds: {
        establishmentSiret: siret,
      },
    });
  }

  async #throwIfMailToEditEstablishmentWasSentRecently(
    notificationRepository: NotificationRepository,
    email: Email,
    now: Date,
  ): Promise<void> {
    const recentNotifications = await notificationRepository.getEmailsByFilters(
      {
        email,
        emailKind: "EDIT_FORM_ESTABLISHMENT_LINK",
        since: subDays(now, 1),
      },
    );

    const lastNotification = recentNotifications.at(-1);

    if (lastNotification) {
      const sentAt = new Date(lastNotification.createdAt);
      throw new BadRequestError(
        `Un email a déjà été envoyé au contact référent de l'établissement le ${sentAt.toLocaleDateString(
          "fr-FR",
        )}`,
      );
    }
  }
}
