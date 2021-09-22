import { DemandeImmersionDto } from "../../../../shared/DemandeImmersionDto";
import { logger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

export class NotifyToTeamApplicationSubmittedByBeneficiary
  implements UseCase<DemandeImmersionDto>
{
  private readonly logger = logger.child({
    logsource: "NotifyToTeamApplicationSubmittedByBeneficiary",
  });

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
    this.logger.info(
      {
        demandeImmersionId: id,
        immersionFacileContactEmail: this.immersionFacileContactEmail,
      },
      "------------- Entering execute.",
    );
    if (!this.immersionFacileContactEmail) {
      this.logger.info(
        { demandeId: id, email },
        "No immersionFacileContactEmail",
      );
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
