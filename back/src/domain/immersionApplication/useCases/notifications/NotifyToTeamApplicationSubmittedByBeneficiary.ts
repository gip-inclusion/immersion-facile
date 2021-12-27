import { parseISO } from "date-fns";
import type { GenerateVerificationMagicLink } from "../../../../adapters/primary/config";
import {
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "../../../../shared/ImmersionApplicationDto";
import { frontRoutes } from "../../../../shared/routes";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import { EmailGateway } from "../../ports/EmailGateway";

const logger = createLogger(__filename);
export class NotifyToTeamApplicationSubmittedByBeneficiary extends UseCase<ImmersionApplicationDto> {
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly agencyRepository: AgencyRepository,
    private readonly generateMagicLinkFn: GenerateVerificationMagicLink,
  ) {
    super();
  }

  inputSchema = immersionApplicationSchema;

  public async _execute({
    id,
    agencyId,
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

    const agencyConfig = await this.agencyRepository.getById(agencyId);
    if (!agencyConfig) {
      throw new Error(
        `Unable to send mail. No agency config found for ${agencyId}`,
      );
    }

    if (agencyConfig.adminEmails.length < 1) {
      logger.info({ demandeId: id, agencyId }, "No adminEmail.");
      return;
    }

    await Promise.all(
      agencyConfig.adminEmails.map((email) =>
        this.emailGateway.sendNewApplicationAdminNotification([email], {
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
            email,
          ),
        }),
      ),
    );
  }
}
