import {
  ApplicationSource,
  DemandeImmersionDto,
} from "../../../../shared/DemandeImmersionDto";
import { logger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

export class ConfirmToBeneficiaryThatApplicationCorrectlySubmitted
  implements UseCase<DemandeImmersionDto>
{
  private readonly logger = logger.child({
    logsource: "ConfirmToBeneficiaryThatApplicationCorrectlySubmitted",
  });

  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly emailAllowList: Readonly<Set<string>>,
    private readonly unrestrictedEmailSendingSources: Readonly<
      Set<ApplicationSource>
    >
  ) {}

  public async execute({
    id,
    source,
    email,
    firstName,
    lastName,
  }: DemandeImmersionDto): Promise<void> {
    this.logger.info(
      { demandeImmersionid: id },
      `------------- Entering execute`
    );

    if (
      this.unrestrictedEmailSendingSources.has(source) ||
      this.emailAllowList.has(email)
    ) {
      await this.emailGateway.sendNewApplicationBeneficiaryConfirmation(email, {
        demandeId: id,
        firstName,
        lastName,
      });
    } else {
      this.logger.info(
        { id, email, source },
        "Sending beneficiary confirmation email skipped."
      );
    }
  }
}
