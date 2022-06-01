import { ConventionDto } from "shared/src/convention/convention.dto";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { conventionSchema } from "shared/src/convention/convention.schema";

const logger = createLogger(__filename);

export class NotifyApplicationPartiallySigned extends UseCase<ConventionDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
  ) {
    super();
  }

  inputSchema = conventionSchema;

  public async _execute({
    id,
    email,
    firstName,
    lastName,
    beneficiaryAccepted,
  }: ConventionDto): Promise<void> {
    logger.error("Not implemented yet!!!");
    return;

    logger.info({ ConventionId: id }, `------------- Entering execute`);

    if (beneficiaryAccepted) {
      // Notify
    } else {
      // Notify differently
    }

    await this.emailFilter.withAllowedRecipients(
      [email],
      ([beneeficiaryEmail]) =>
        this.emailGateway.sendNewConventionBeneficiaryConfirmation(
          beneeficiaryEmail,
          {
            demandeId: id,
            firstName,
            lastName,
          },
        ),
      logger,
    );
  }
}
