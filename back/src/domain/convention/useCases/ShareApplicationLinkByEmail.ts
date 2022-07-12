import { UseCase } from "../../core/UseCase";
import { EmailGateway } from "../ports/EmailGateway";
import {
  ShareLinkByEmailDto,
  shareLinkByEmailSchema,
} from "shared/src/ShareLinkByEmailDto";

export class ShareApplicationLinkByEmail extends UseCase<ShareLinkByEmailDto> {
  constructor(private readonly emailGateway: EmailGateway) {
    super();
  }
  inputSchema = shareLinkByEmailSchema;

  public async _execute(params: ShareLinkByEmailDto): Promise<void> {
    await this.emailGateway.sendEmail({
      type: "SHARE_DRAFT_CONVENTION_BY_LINK",
      recipients: [params.email],
      params: {
        additionalDetails: params.details,
        conventionFormUrl: params.conventionLink,
      },
    });
  }
}
