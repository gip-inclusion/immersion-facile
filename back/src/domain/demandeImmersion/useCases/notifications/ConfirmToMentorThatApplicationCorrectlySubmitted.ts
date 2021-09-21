import {
  ApplicationSource,
  DemandeImmersionDto,
} from "../../../../shared/DemandeImmersionDto";
import { logger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

export class ConfirmToMentorThatApplicationCorrectlySubmitted
  implements UseCase<DemandeImmersionDto>
{
  private readonly logger = logger.child({
    logsource: "ConfirmToMentorThatApplicationCorrectlySubmitted",
  });

  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly emailAllowList: Readonly<Set<string>>,
    private readonly unrestrictedEmailSendingSources: Readonly<
      Set<ApplicationSource>
    >
  ) {}

  public async execute({
    id,
    source,
    mentor,
    mentorEmail,
    firstName,
    lastName,
  }: DemandeImmersionDto): Promise<void> {
    this.logger.info(
      {
        demandeImmersionid: id,
      },
      "------------- Entering execute."
    );

    if (
      this.unrestrictedEmailSendingSources.has(source) ||
      this.emailAllowList.has(mentorEmail)
    ) {
      await this.emailGateway.sendNewApplicationMentorConfirmation(
        mentorEmail,
        {
          demandeId: id,
          mentorName: mentor,
          beneficiaryFirstName: firstName,
          beneficiaryLastName: lastName,
        }
      );
    } else {
      this.logger.info(
        { id, mentorEmail, source },
        "Sending mentor confirmation email skipped."
      );
    }
  }
}
