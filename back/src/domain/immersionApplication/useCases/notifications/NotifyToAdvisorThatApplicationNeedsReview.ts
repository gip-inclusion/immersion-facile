import { ImmersionApplicationDto } from "../../../../shared/ImmersionApplicationDto";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import { generateMagicLinkString } from "./NotificationsHelpers";

const logger = createLogger(__filename);
export class NotifyToTeamApplicationSubmittedByBeneficiary
  implements UseCase<ImmersionApplicationDto>
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
  }: ImmersionApplicationDto): Promise<void> {
    if (!this.immersionFacileContactEmail) {
      logger.info({ demandeId: id, email }, "No immersionFacileContactEmail");
      return;
    }

    // I need to know who's gonna process this immersion application

    await this.emailGateway.sendNewApplicationAdvisorNotification(
      [this.immersionFacileContactEmail],
      {
        demandeId: id,
        firstName,
        lastName,
        dateStart,
        dateEnd,
        businessName,
        magicLink: generateMagicLinkString(id, "advisor"),
      },
    );
  }
}
