import { FeatureFlags } from "../../../../shared/featureFlags";
import {
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "../../../../shared/ImmersionApplicationDto";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

const logger = createLogger(__filename);
export class ConfirmToMentorThatApplicationCorrectlySubmitted extends UseCase<ImmersionApplicationDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly featureFlags: FeatureFlags,
  ) {
    super();
  }

  inputSchema = immersionApplicationSchema;

  public async _execute({
    id,
    mentor,
    mentorEmail,
    firstName,
    lastName,
  }: ImmersionApplicationDto): Promise<void> {
    if (this.featureFlags.enableEnterpriseSignature) {
      logger.info(`Skipping sending non-signature mentor confirmation`);
      return;
    }

    logger.info(
      {
        demandeImmersionid: id,
      },
      "------------- Entering execute.",
    );

    const [allowedMentorEmail] = this.emailFilter.filter([mentorEmail], {
      onRejected: (email) =>
        logger.info(
          { id, email },
          "Sending mentor confirmation email skipped.",
        ),
    });

    if (allowedMentorEmail) {
      await this.emailGateway.sendNewApplicationMentorConfirmation(
        allowedMentorEmail,
        {
          demandeId: id,
          mentorName: mentor,
          beneficiaryFirstName: firstName,
          beneficiaryLastName: lastName,
        },
      );
    }
  }
}
