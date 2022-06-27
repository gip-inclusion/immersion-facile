import { AgencyDto } from "shared/src/agency/agency.dto";
import { agencySchema } from "shared/src/agency/agency.schema";
import { z } from "zod";
import { UseCase } from "../../core/UseCase";
import { EmailGateway } from "../ports/EmailGateway";

type WithAgency = { agency: AgencyDto };

export class SendEmailWhenAgencyIsActivated extends UseCase<WithAgency> {
  inputSchema = z.object({ agency: agencySchema });

  constructor(private readonly emailGateway: EmailGateway) {
    super();
  }

  public async _execute({ agency }: WithAgency): Promise<void> {
    const recipients = agency.validatorEmails;
    await this.emailGateway.sendAgencyWasActivated(recipients, {
      agencyName: agency.name,
    });
  }
}
