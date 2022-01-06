import {
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "../../../../shared/ImmersionApplicationDto";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";

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
    mentorEmail,
    mentor,
    beneficiaryAccepted,
  }: ImmersionApplicationDto): Promise<void> {
    logger.error("Not implemented yet!!!");
    return;

    logger.info({ demandeImmersionid: id }, `------------- Entering execute`);

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
