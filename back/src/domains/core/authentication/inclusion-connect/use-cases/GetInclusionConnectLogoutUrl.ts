import { AbsoluteUrl } from "shared";
import { z } from "zod";
import { UseCase } from "../../../UseCase";
import { InclusionConnectGateway } from "../port/InclusionConnectGateway";

export class GetInclusionConnectLogoutUrl extends UseCase<void, AbsoluteUrl> {
  protected inputSchema = z.void();

  constructor(private inclusionConnectGateway: InclusionConnectGateway) {
    super();
  }

  public async _execute(): Promise<AbsoluteUrl> {
    return this.inclusionConnectGateway.getLogoutUrl();
  }
}
