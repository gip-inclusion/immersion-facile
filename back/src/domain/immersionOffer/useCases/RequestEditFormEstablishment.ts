import subDays from "date-fns/subDays";
import {
  createEstablishmentMagicLinkPayload,
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
  inputSchema = siretSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    private timeGateway: TimeGateway,
    private generateEditFormEstablishmentUrl: GenerateEditFormEstablishmentJwt,
  ) {
    super(uowPerformer);
  }

  protected async _execute(siret: SiretDto, uow: UnitOfWork) {
    const contact = (
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      )
    )?.contact;

    if (!contact) throw Error("Email du contact introuvable.");

    const now = this.timeGateway.now();

    await this.throwIfMailToEditEstablishmentWasSentRecently(
      uow.notificationRepository,
      contact.email,
      now,
    );

    const payload = createEstablishmentMagicLinkPayload({
      siret,
      now,
      durationDays: 1,
    });

    const editFrontUrl = this.generateEditFormEstablishmentUrl(payload);

    await this.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "EDIT_FORM_ESTABLISHMENT_LINK",
        recipients: [contact.email],
        cc: contact.copyEmails,
        params: { editFrontUrl },
      },
      followedIds: {
        establishmentSiret: siret,
      },
    });
  }

  private async throwIfMailToEditEstablishmentWasSentRecently(
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
