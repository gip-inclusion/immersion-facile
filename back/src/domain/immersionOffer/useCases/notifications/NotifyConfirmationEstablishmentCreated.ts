import { FormEstablishmentDto, formEstablishmentSchema } from "shared";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";

export class NotifyConfirmationEstablishmentCreated extends TransactionalUseCase<FormEstablishmentDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
  }
  inputSchema = formEstablishmentSchema;

  public async _execute(
    formEstablishment: FormEstablishmentDto,
    uow: UnitOfWork,
  ): Promise<void> {
    await this.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
        recipients: [formEstablishment.businessContact.email],
        cc: formEstablishment.businessContact.copyEmails,
        params: {
          contactFirstName: formEstablishment.businessContact.firstName,
          contactLastName: formEstablishment.businessContact.lastName,
          businessName: formEstablishment.businessName,
        },
      },
      followedIds: {
        establishmentSiret: formEstablishment.siret,
      },
    });
  }
}
