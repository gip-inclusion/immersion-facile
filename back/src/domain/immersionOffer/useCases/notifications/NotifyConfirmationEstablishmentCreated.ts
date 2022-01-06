import {
  FormEstablishmentDto,
  formEstablishmentSchema,
} from "../../../../shared/FormEstablishmentDto";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../../immersionApplication/ports/EmailGateway";

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
    await this.emailFilter.withAllowedRecipients(
      [formEstablishment.businessContacts[0].email],
      ([establishmentContactEmail]) =>
        this.emailGateway.sendNewEstablismentContactConfirmation(
          establishmentContactEmail,
          { ...formEstablishment },
        ),
      logger,
    );
  }
}
