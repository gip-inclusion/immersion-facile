import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { frontRoutes } from "../../../../shared/routes";
import { GenerateVerificationMagicLink } from "../../../../adapters/primary/config";
import { FeatureFlags } from "../../../../shared/featureFlags";
import {
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "../../../../shared/ImmersionApplicationDto";

const logger = createLogger(__filename);

export class ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature extends UseCase<ImmersionApplicationDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateVerificationMagicLink,
    private readonly featureFlags: FeatureFlags,
  ) {
    super();
  }

  inputSchema = immersionApplicationSchema;

  public async _execute(application: ImmersionApplicationDto): Promise<void> {
    if (!this.featureFlags.enableEnterpriseSignature) {
      logger.info(`Skipping sending signature-requesting mentor confirmation`);
      return;
    }
    if (application.status === "PARTIALLY_SIGNED") {
      logger.info(
        `Skipping sending signature-requiring mentor confirmation as application is already partially signed`,
      );
      return;
    }

    const { id, mentorEmail, firstName, lastName, businessName, mentor } =
      application;

    logger.info({ demandeImmersionid: id }, `------------- Entering execute`);

    const [allowedMentorEmail] = this.emailFilter.filter([mentorEmail], {
      onRejected: (email) =>
        logger.info(
          { id, email },
          "Sending mentor confirmation email skipped.",
        ),
    });

    if (allowedMentorEmail) {
      await this.emailGateway.sendEnterpriseSignatureRequestNotification(
        allowedMentorEmail,
        {
          beneficiaryFirstName: firstName,
          beneficiaryLastName: lastName,
          magicLink: this.generateMagicLinkFn(
            application.id,
            "establishment",
            frontRoutes.immersionApplicationsToSign,
          ),
          businessName: businessName,
          mentorName: mentor,
        },
      );
    }
  }
}
