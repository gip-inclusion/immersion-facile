import { parseISO } from "date-fns";
import { GenerateVerificationMagicLink } from "../../../../adapters/primary/config";
import { ImmersionApplicationDto } from "../../../../shared/ImmersionApplication/ImmersionApplication.dto";
import { frontRoutes } from "../../../../shared/routes";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import { EmailGateway } from "../../ports/EmailGateway";
import { immersionApplicationSchema } from "../../../../shared/ImmersionApplication/immersionApplication.schema";

const logger = createLogger(__filename);
export class NotifyToAdminsApplicationValidated extends UseCase<ImmersionApplicationDto> {
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
