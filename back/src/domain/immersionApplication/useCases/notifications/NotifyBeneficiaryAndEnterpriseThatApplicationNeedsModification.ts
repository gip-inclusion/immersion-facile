import { ImmersionApplicationDto } from "../../../../shared/ImmersionApplicationDto";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import {
  EmailGateway,
  ModificationRequestApplicationNotificationParams,
} from "../../ports/EmailGateway";
import { AgencyConfig } from "../../ports/AgencyRepository";
import { GenerateVerificationMagicLink } from "../../../../adapters/primary/config";
import { frontRoutes } from "../../../../shared/routes";

const logger = createLogger(__filename);

export type ImmersionApplicationRequiresModificationPayload = {
  application: ImmersionApplicationDto;
  reason: string;
};
export class NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification
  implements UseCase<ImmersionApplicationRequiresModificationPayload>
{
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly emailAllowList: Readonly<Set<string>>,
    private readonly agencyRepository: AgencyRepository,
    private readonly generateMagicLinkFn: GenerateVerificationMagicLink,
  ) {}

  public async execute({
    application,
    reason,
  }: ImmersionApplicationRequiresModificationPayload): Promise<void> {
    const agencyConfig = await this.agencyRepository.getConfig(
      application.agencyCode,
    );
    if (!agencyConfig) {
      throw new Error(
        `Unable to send mail. No agency config found for ${application.agencyCode}`,
      );
    }

    // Note that MODIFICATION_REQUEST_APPLICATION_NOTIFICATION template is phrased to address the
    // beneficiary only, so it needs to be updated if the list of recipients is changed.
    let recipients = [application.email];

    if (!agencyConfig.allowUnrestrictedEmailSending) {
      recipients = recipients.filter((email) => {
        if (!this.emailAllowList.has(email)) {
          logger.info(`Skipped sending email to: ${email}`);
          return false;
        }
        return true;
      });
    }

    if (recipients.length > 0) {
      await this.emailGateway.sendModificationRequestApplicationNotification(
        recipients,
        getModificationRequestApplicationNotificationParams(
          application,
          agencyConfig,
          reason,
          this.generateMagicLinkFn(
            application.id,
            "beneficiary",
            frontRoutes.immersionApplicationsRoute,
          ),
        ),
      );
    } else {
      logger.info(
        {
          id: application.id,
          recipients,
          source: application.source,
          reason,
        },
        "Sending modification request confirmation email skipped.",
      );
    }
  }
}

const getModificationRequestApplicationNotificationParams = (
  dto: ImmersionApplicationDto,
  agencyConfig: AgencyConfig,
  reason: string,
  magicLink: string,
): ModificationRequestApplicationNotificationParams => {
  return {
    beneficiaryFirstName: dto.firstName,
    beneficiaryLastName: dto.lastName,
    businessName: dto.businessName,
    reason,
    signature: agencyConfig.signature,
    agency: agencyConfig.name,
    immersionProfession: dto.immersionProfession,
    magicLink,
  };
};
