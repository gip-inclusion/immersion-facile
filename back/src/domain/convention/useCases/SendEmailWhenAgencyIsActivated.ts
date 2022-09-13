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
    await this.emailGateway.sendEmail({
      type: "AGENCY_WAS_ACTIVATED",
      recipients: agency.validatorEmails,
      params: {
        agencyName: agency.name,
        agencyLogoUrl: agency.logoUrl,
      },
    });
  }
}
