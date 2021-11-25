import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../../immersionApplication/ports/EmailGateway";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import {
  FormEstablishmentDto,
  formEstablishmentSchema,
} from "../../../../shared/FormEstablishmentDto";
import { createLogger } from "../../../../utils/logger";

const logger = createLogger(__filename);

export class NotifyConfirmationEstablishmentCreated extends UseCase<FormEstablishmentDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
  ) {
    super();
  }
  inputSchema = formEstablishmentSchema;

  public async _execute(
    formEstablishment: FormEstablishmentDto,
  ): Promise<void> {
    const recipients = this.emailFilter.filter(
      [formEstablishment.businessContacts[0].email],
      {
        onRejected: (email) =>
          logger.info(`Skipped sending email to: ${email}`),
      },
    );

    if (recipients.length > 0) {
      await this.emailGateway.sendNewEstablismentContactConfirmation(
        formEstablishment.businessContacts[0].email,
        { ...formEstablishment },
      );
    } else {
      logger.info(
        {
          establishment: formEstablishment.businessName,
          recipients,
        },
        "Sending Establishment Created confirmation email skipped.",
      );
    }
  }
}
