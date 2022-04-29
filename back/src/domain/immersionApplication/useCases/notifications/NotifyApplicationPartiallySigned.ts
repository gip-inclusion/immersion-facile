import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { immersionApplicationSchema } from "shared/src/ImmersionApplication/immersionApplication.schema";

const logger = createLogger(__filename);

export class NotifyApplicationPartiallySigned extends UseCase<ImmersionApplicationDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
  ) {
    super();
  }

  inputSchema = immersionApplicationSchema;

  public async _execute({
    id,
    email,
    firstName,
    lastName,
    beneficiaryAccepted,
  }: ImmersionApplicationDto): Promise<void> {
    logger.error("Not implemented yet!!!");
    return;

    logger.info(
      { immersionApplicationId: id },
      `------------- Entering execute`,
    );

    if (beneficiaryAccepted) {
      // Notify
    } else {
      // Notify differently
    }

    await this.emailFilter.withAllowedRecipients(
      [email],
      ([beneeficiaryEmail]) =>
        this.emailGateway.sendNewApplicationBeneficiaryConfirmation(
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
