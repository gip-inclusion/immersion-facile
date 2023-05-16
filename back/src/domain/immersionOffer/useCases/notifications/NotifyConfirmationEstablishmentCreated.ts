import { FormEstablishmentDto, formEstablishmentSchema } from "shared";
import { NotificationGateway } from "../../../convention/ports/NotificationGateway";
import { UseCase } from "../../../core/UseCase";

export class NotifyConfirmationEstablishmentCreated extends UseCase<FormEstablishmentDto> {
  constructor(private readonly notificationGateway: NotificationGateway) {
    super();
  }
  inputSchema = formEstablishmentSchema;

  public async _execute(
    formEstablishment: FormEstablishmentDto,
  ): Promise<void> {
    await this.notificationGateway.sendEmail({
      type: "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
      recipients: [formEstablishment.businessContact.email],
      cc: formEstablishment.businessContact.copyEmails,
      params: {
        contactFirstName: formEstablishment.businessContact.firstName,
        contactLastName: formEstablishment.businessContact.lastName,
        businessName: formEstablishment.businessName,
      },
    });
  }
}
