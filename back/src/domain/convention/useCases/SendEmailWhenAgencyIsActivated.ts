import { z } from "zod";
import { AgencyDto, agencySchema } from "shared";
import { UseCase } from "../../core/UseCase";
import { NotificationGateway } from "../../generic/notifications/ports/NotificationGateway";

type WithAgency = { agency: AgencyDto };

export class SendEmailWhenAgencyIsActivated extends UseCase<WithAgency> {
  inputSchema = z.object({ agency: agencySchema });

  constructor(private readonly notificationGateway: NotificationGateway) {
    super();
  }

  public async _execute({ agency }: WithAgency): Promise<void> {
    await this.notificationGateway.sendEmail({
      type: "AGENCY_WAS_ACTIVATED",
      recipients: agency.validatorEmails,
      params: {
        agencyName: agency.name,
        agencyLogoUrl: agency.logoUrl,
      },
    });
  }
}
