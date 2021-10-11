import { ImmersionApplicationDto } from "../../../../shared/ImmersionApplicationDto";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyConfigRepository";
import { EmailGateway } from "../../ports/EmailGateway";
import { createLogger } from "./../../../../utils/logger";

const logger = createLogger(__filename);

export class ConfirmToBeneficiaryThatApplicationCorrectlySubmitted
  implements UseCase<ImmersionApplicationDto>
{
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly emailAllowList: Readonly<Set<string>>,
    private readonly agencyRepository: AgencyRepository,
  ) {}

  public async execute({
    id,
    agencyCode,
    email,
    firstName,
    lastName,
  }: ImmersionApplicationDto): Promise<void> {
    logger.info({ demandeImmersionid: id }, `------------- Entering execute`);

    const agencyConfig = await this.agencyRepository.getConfig(agencyCode);
    if (!agencyConfig) {
      throw new Error(
        `Unable to send mail. No agency config found for ${agencyCode}`,
      );
    }

    if (
      agencyConfig.allowUnrestrictedEmailSending ||
      this.emailAllowList.has(email)
    ) {
      await this.emailGateway.sendNewApplicationBeneficiaryConfirmation(email, {
        demandeId: id,
        firstName,
        lastName,
      });
    } else {
      logger.info(
        { id, email, agencyCode },
        "Sending beneficiary confirmation email skipped.",
      );
    }
  }
}
