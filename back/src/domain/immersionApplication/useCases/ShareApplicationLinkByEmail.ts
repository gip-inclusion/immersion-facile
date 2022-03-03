import { UseCase } from "../../core/UseCase";
import { EmailGateway } from "../ports/EmailGateway";
import { z } from "zod";

type ShareApplicationByEmailParams = {
  immersionApplicationLink: string;
  email: string;
  details: string;
};

export class ShareApplicationLinkByEmail extends UseCase<ShareApplicationByEmailParams> {
  constructor(private readonly emailGateway: EmailGateway) {
    super();
  }
  inputSchema = z.object({
    email: z.string(),
    details: z.string(),
    immersionApplicationLink: z.string(),
  });

  public async _execute(params: ShareApplicationByEmailParams): Promise<void> {
    await this.emailGateway.sendShareDraftApplicationByLink(params.email, {
      additional_details: params.details,
      application_form_url: params.immersionApplicationLink,
    });
  }
}
