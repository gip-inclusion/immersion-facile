import { WithFormEstablishmentDto, withFormEstablishmentSchema } from "shared";
import { TransactionalUseCase } from "../../../core/UseCase";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { SaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";

export class NotifyConfirmationEstablishmentCreated extends TransactionalUseCase<WithFormEstablishmentDto> {
  protected inputSchema = withFormEstablishmentSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  public async _execute(
    { formEstablishment }: WithFormEstablishmentDto,
    uow: UnitOfWork,
  ): Promise<void> {
    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
        recipients: [formEstablishment.businessContact.email],
        cc: formEstablishment.businessContact.copyEmails,
        params: {
          contactFirstName: formEstablishment.businessContact.firstName,
          contactLastName: formEstablishment.businessContact.lastName,
          businessName: formEstablishment.businessName,
          businessAddresses: formEstablishment.businessAddresses.map(
            ({ rawAddress }) => rawAddress,
          ),
        },
      },
      followedIds: {
        establishmentSiret: formEstablishment.siret,
      },
    });
  }
}
