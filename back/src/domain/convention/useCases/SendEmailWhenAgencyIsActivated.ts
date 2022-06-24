import { AgencyDto } from "shared/src/agency/agency.dto";
import { agencySchema } from "shared/src/agency/agency.schema";
import { UseCase } from "../../core/UseCase";
import { EmailGateway } from "../ports/EmailGateway";

export class SendEmailWhenAgencyIsActivated extends UseCase<AgencyDto> {
  inputSchema = agencySchema;

  constructor(private readonly emailGateway: EmailGateway) {
    super();
  }

  public async _execute(agencyDto: AgencyDto): Promise<void> {
    const recipients = agencyDto.validatorEmails;
    await this.emailGateway.sendAgencyWasActivated(recipients, {
      agencyName: agencyDto.name,
    });
  }
}
