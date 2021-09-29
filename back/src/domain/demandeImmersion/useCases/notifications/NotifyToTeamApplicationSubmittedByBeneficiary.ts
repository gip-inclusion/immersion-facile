import { DemandeImmersionDto } from "../../../../shared/DemandeImmersionDto";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

const logger = createLogger(__filename);
export class NotifyToTeamApplicationSubmittedByBeneficiary
  implements UseCase<DemandeImmersionDto>
{
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly immersionFacileContactEmail: string | undefined,
  ) {}

  public async execute({
    id,
    email,
    firstName,
    lastName,
    dateStart,
    dateEnd,
    businessName,
  }: DemandeImmersionDto): Promise<void> {
    logger.info(
      {
        demandeImmersionId: id,
        immersionFacileContactEmail: this.immersionFacileContactEmail,
      },
      "------------- Entering execute.",
    );
    if (!this.immersionFacileContactEmail) {
      logger.info({ demandeId: id, email }, "No immersionFacileContactEmail");
      return;
    }

    await this.emailGateway.sendNewApplicationAdminNotification(
      [this.immersionFacileContactEmail],
      {
        demandeId: id,
        firstName,
        lastName,
        dateStart,
        dateEnd,
        businessName,
      },
    );
  }
}
