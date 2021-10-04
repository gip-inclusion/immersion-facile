import {
  ApplicationSource,
  ImmersionApplicationDto,
} from "../../../../shared/ImmersionApplicationDto";
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
    private readonly unrestrictedEmailSendingSources: Readonly<
      Set<ApplicationSource>
    >,
  ) {}

  public async execute({
    id,
    source,
    email,
    firstName,
    lastName,
  }: ImmersionApplicationDto): Promise<void> {
    logger.info({ demandeImmersionid: id }, `------------- Entering execute`);

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
      logger.info(
        { id, email, source },
        "Sending beneficiary confirmation email skipped.",
      );
    }
  }
}
