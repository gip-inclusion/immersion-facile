import { agencyCodes } from "../../../../shared/agencies";
import { ImmersionApplicationDto } from "../../../../shared/ImmersionApplicationDto";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import { EmailGateway } from "../../ports/EmailGateway";
import { GenerateMagicLinkFn } from "./NotificationsHelpers";

const logger = createLogger(__filename);
export class NotifyToTeamApplicationSubmittedByBeneficiary
  implements UseCase<ImmersionApplicationDto>
{
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly agencyRepository: AgencyRepository,
    private readonly generateMagicLinkFn: GenerateMagicLinkFn,
  ) {}

  public async execute({
    id,
    agencyCode,
    firstName,
    lastName,
    dateStart,
    dateEnd,
    businessName,
  }: ImmersionApplicationDto): Promise<void> {
    logger.info(
      {
        demandeImmersionId: id,
      },
      "------------- Entering execute.",
    );

    const agencyConfig = await this.agencyRepository.getConfig(agencyCode);
    if (!agencyConfig) {
      throw new Error(
        `Unable to send mail. No agency config found for ${agencyCode}`,
      );
    }

    if (agencyConfig.adminEmails.length < 1) {
      logger.info({ demandeId: id, agencyCode }, "No adminEmail.");
      return;
    }

    await this.emailGateway.sendNewApplicationAdminNotification(
      agencyConfig.adminEmails,
      {
        demandeId: id,
        firstName,
        lastName,
        dateStart,
        dateEnd,
        businessName,
        agencyName: agencyCodes[agencyCode],
        magicLink: this.generateMagicLinkFn(id, "admin"),
      },
    );
  }
}
