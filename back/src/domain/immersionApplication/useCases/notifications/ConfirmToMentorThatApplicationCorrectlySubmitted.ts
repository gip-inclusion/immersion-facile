import {
  ApplicationSource,
  ImmersionApplicationDto,
} from "../../../../shared/ImmersionApplicationDto";
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
    private readonly unrestrictedEmailSendingSources: Readonly<
      Set<ApplicationSource>
    >,
  ) {}

  public async execute({
    id,
    source,
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
        },
      );
    } else {
      logger.info(
        { id, mentorEmail, source },
        "Sending mentor confirmation email skipped.",
      );
    }
  }
}
