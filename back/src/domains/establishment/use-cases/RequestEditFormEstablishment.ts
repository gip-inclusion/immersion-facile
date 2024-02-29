import subDays from "date-fns/subDays";
import {
  Email,
  SiretDto,
  addressDtoToString,
  createEstablishmentJwtPayload,
  siretSchema,
} from "shared";
import { BadRequestError } from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { GenerateEditFormEstablishmentJwt } from "../../core/jwt";
import { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { NotificationRepository } from "../../core/notifications/ports/NotificationRepository";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

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
          businessAddresses: establishment.locations.map((addressAndPosition) =>
            addressDtoToString(addressAndPosition.address),
          ),
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
