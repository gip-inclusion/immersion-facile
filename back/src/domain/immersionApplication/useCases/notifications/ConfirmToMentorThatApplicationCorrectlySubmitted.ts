import { AgencyCode } from "../../../../shared/agencies";
import { ImmersionApplicationDto } from "../../../../shared/ImmersionApplicationDto";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

const logger = createLogger(__filename);
export class ConfirmToMentorThatApplicationCorrectlySubmitted
  implements UseCase<ImmersionApplicationDto>
{
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly emailAllowList: Readonly<Set<string>>,
    private readonly unrestrictedEmailSendingAgencies: Readonly<
      Set<AgencyCode>
    >,
  ) {}

  public async execute({
    id,
    agencyCode,
    mentor,
    mentorEmail,
    firstName,
    lastName,
  }: ImmersionApplicationDto): Promise<void> {
    logger.info(
      {
        demandeImmersionid: id,
      },
      "------------- Entering execute.",
    );

    if (
      this.unrestrictedEmailSendingAgencies.has(agencyCode) ||
      this.emailAllowList.has(mentorEmail)
    ) {
      await this.emailGateway.sendNewApplicationMentorConfirmation(
        mentorEmail,
        {
          demandeId: id,
          mentorName: mentor,
          beneficiaryFirstName: firstName,
          beneficiaryLastName: lastName,
        },
      );
    } else {
      logger.info(
        { id, mentorEmail, agencyCode },
        "Sending mentor confirmation email skipped.",
      );
    }
  }
}
