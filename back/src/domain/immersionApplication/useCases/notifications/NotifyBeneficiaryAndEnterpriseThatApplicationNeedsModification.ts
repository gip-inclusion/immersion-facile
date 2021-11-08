import { z } from "zod";
import { GenerateVerificationMagicLink } from "../../../../adapters/primary/config";
import {
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "../../../../shared/ImmersionApplicationDto";
import { frontRoutes } from "../../../../shared/routes";
import { zString } from "../../../../shared/zodUtils";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { AgencyConfig, AgencyRepository } from "../../ports/AgencyRepository";
import {
  EmailGateway,
  ModificationRequestApplicationNotificationParams,
} from "../../ports/EmailGateway";

const logger = createLogger(__filename);

// prettier-ignore
export type ImmersionApplicationRequiresModificationPayload = z.infer<typeof immersionApplicationRequiresModificationSchema>
const immersionApplicationRequiresModificationSchema = z.object({
  application: immersionApplicationSchema,
  reason: zString,
});

export class NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification extends UseCase<ImmersionApplicationRequiresModificationPayload> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly agencyRepository: AgencyRepository,
    private readonly generateMagicLinkFn: GenerateVerificationMagicLink,
  ) {
    super();
  }

  inputSchema = immersionApplicationRequiresModificationSchema;

  public async _execute({
    application,
    reason,
  }: ImmersionApplicationRequiresModificationPayload): Promise<void> {
    const agencyConfig = await this.agencyRepository.getById(
      application.agencyId,
    );
    if (!agencyConfig) {
      throw new Error(
        `Unable to send mail. No agency config found for ${application.agencyId}`,
      );
    }

    // Note that MODIFICATION_REQUEST_APPLICATION_NOTIFICATION template is phrased to address the
    // beneficiary only, so it needs to be updated if the list of recipients is changed.
    const recipients = this.emailFilter.filter([application.email], {
      onRejected: (email) => logger.info(`Skipped sending email to: ${email}`),
    });

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
