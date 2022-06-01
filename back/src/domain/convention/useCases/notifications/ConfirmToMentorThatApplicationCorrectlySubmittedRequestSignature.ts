import { GenerateConventionMagicLink } from "../../../../adapters/primary/config/createGenerateConventionMagicLink";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { frontRoutes } from "shared/src/routes";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";

const logger = createLogger(__filename);

export class ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature extends UseCase<ConventionDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateConventionMagicLink,
  ) {
    super();
  }

  inputSchema = conventionSchema;

  public async _execute(application: ConventionDto): Promise<void> {
    if (application.status === "PARTIALLY_SIGNED") {
      logger.info(
        `Skipping sending signature-requiring mentor confirmation as application is already partially signed`,
      );
      return;
    }

    const { id, mentorEmail, firstName, lastName, businessName, mentor } =
      application;

    logger.info({ ConventionId: id }, `------------- Entering execute`);

    await this.emailFilter.withAllowedRecipients(
      [mentorEmail],
      ([mentorEmail]) =>
        this.emailGateway.sendEnterpriseSignatureRequestNotification(
          mentorEmail,
          {
            beneficiaryFirstName: firstName,
            beneficiaryLastName: lastName,
            magicLink: this.generateMagicLinkFn({
              id: application.id,
              role: "establishment",
              targetRoute: frontRoutes.conventionToSign,
              email: mentorEmail,
            }),
            businessName,
            mentorName: mentor,
          },
        ),
      logger,
    );
  }
}
