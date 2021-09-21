import {
  ApplicationSource,
  DemandeImmersionDto,
} from "../../../../shared/DemandeImmersionDto";
import { logger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

export class NotifyAllActorsOfFinalApplicationValidation
  implements UseCase<DemandeImmersionDto>
{
  private readonly logger = logger.child({
    logsource: "NotifyAllActorsOfFinalApplicationValidation",
  });

  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly emailAllowList: Readonly<Set<string>>,
    private readonly unrestrictedEmailSendingSources: Readonly<
      Set<ApplicationSource>
    >
  ) {}

  public async execute(dto: DemandeImmersionDto): Promise<void> {
    this.logger.info(
      {
        demandeImmersionid: dto.id,
      },
      "------------- Entering execute."
    );

    let recipients = [dto.email, dto.mentorEmail];
    if (!this.unrestrictedEmailSendingSources.has(dto.source)) {
      recipients = recipients.filter((email) => this.emailAllowList.has(email));
    }

    if (recipients.length > 0) {
      await this.emailGateway.sendValidatedApplicationFinalConfirmation(
        recipients,
        dto
      );
    } else {
      this.logger.info(
        {
          id: dto.id,
          recipients,
          source: dto.source,
        },
        "Sending validation confirmation email skipped."
      );
    }
  }
}
