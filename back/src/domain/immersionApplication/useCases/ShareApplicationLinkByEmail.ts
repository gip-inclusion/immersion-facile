import { UseCase } from "../../core/UseCase";
import { EmailGateway } from "../ports/EmailGateway";
import {
  ShareLinkByEmailDTO,
  shareLinkByEmailSchema,
} from "../../../shared/ShareLinkByEmailDTO";

export class ShareApplicationLinkByEmail extends UseCase<
  ShareLinkByEmailDTO,
  boolean
> {
  constructor(private readonly emailGateway: EmailGateway) {
    super();
  }
  inputSchema = shareLinkByEmailSchema;

  public async _execute(params: ShareLinkByEmailDTO): Promise<boolean> {
    try {
      await this.emailGateway.sendShareDraftApplicationByLink(params.email, {
        additional_details: toFormattedDetails(params?.details),
        application_form_url: params.immersionApplicationLink,
      });

      return true;
    } catch (e: any) {
      return false;
    }
  }
}

const toFormattedDetails = (details: string | undefined): string => {
  return details ? `Détails additionnels : ${details}` : "";
};
