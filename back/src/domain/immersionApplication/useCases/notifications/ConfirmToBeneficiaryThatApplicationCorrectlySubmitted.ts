import { AgencyCode } from "../../../../shared/agencies";
import { ImmersionApplicationDto } from "../../../../shared/ImmersionApplicationDto";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import { createLogger } from "./../../../../utils/logger";

const logger = createLogger(__filename);

export class ConfirmToBeneficiaryThatApplicationCorrectlySubmitted
  implements UseCase<ImmersionApplicationDto>
{
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly emailAllowList: Readonly<Set<string>>,
    private readonly unrestrictedEmailSendingAgencies: Readonly<
      Set<AgencyCode>
    >,
  ) {}

  public async execute({
    id,
    agencyCode,
    email,
    firstName,
    lastName,
  }: ImmersionApplicationDto): Promise<void> {
    logger.info({ demandeImmersionid: id }, `------------- Entering execute`);

    if (
      this.unrestrictedEmailSendingAgencies.has(agencyCode) ||
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
