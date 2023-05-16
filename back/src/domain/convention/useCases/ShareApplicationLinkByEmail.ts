import { ShareLinkByEmailDto, shareLinkByEmailSchema } from "shared";
import { UseCase } from "../../core/UseCase";
import { NotificationGateway } from "../ports/NotificationGateway";

export class ShareApplicationLinkByEmail extends UseCase<ShareLinkByEmailDto> {
  constructor(private readonly notificationGateway: NotificationGateway) {
    super();
  }
  inputSchema = shareLinkByEmailSchema;

  public async _execute(params: ShareLinkByEmailDto): Promise<void> {
    await this.notificationGateway.sendEmail({
      type: "SHARE_DRAFT_CONVENTION_BY_LINK",
      recipients: [params.email],
      params: {
        internshipKind: params.internshipKind,
        additionalDetails: params.details,
        conventionFormUrl: params.conventionLink,
      },
    });
  }
}
