import { ImmersionApplicationDto } from "../../../../shared/ImmersionApplicationDto";

import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import { EmailGateway } from "../../ports/EmailGateway";
import { GenerateVerificationMagicLink } from "../../../../adapters/primary/config";
import { frontRoutes } from "../../../../shared/routes";
import { parseISO } from "date-fns";

const logger = createLogger(__filename);
export class NotifyToAdminsApplicationValidated
  implements UseCase<ImmersionApplicationDto>
{
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly agencyRepository: AgencyRepository,
    private readonly generateMagicLinkFn: GenerateVerificationMagicLink,
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
        dateStart: parseISO(dateStart).toLocaleDateString("fr"),
        dateEnd: parseISO(dateEnd).toLocaleDateString("fr"),
        businessName,
        agencyName: agencyConfig.name,
        magicLink: this.generateMagicLinkFn(
          id,
          "admin",
          frontRoutes.immersionApplicationsToValidate,
        ),
      },
    );
  }
}
