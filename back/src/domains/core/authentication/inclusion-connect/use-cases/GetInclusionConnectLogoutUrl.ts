import { AbsoluteUrl, queryParamsAsString } from "shared";
import { z } from "zod";
import { UseCase } from "../../../UseCase";
import { InclusionConnectLogoutQueryParams } from "../adapters/Inclusion-connect-gateway/inclusionConnectExternalRoutes";
import { InclusionConnectConfig } from "./InitiateInclusionConnect";

export class GetInclusionConnectLogoutUrl extends UseCase<void, AbsoluteUrl> {
  protected inputSchema = z.void();

  constructor(
    private immersionBaseUrl: AbsoluteUrl,
    private inclusionConnectConfig: InclusionConnectConfig,
  ) {
    super();
  }

  public async _execute(): Promise<AbsoluteUrl> {
    const queryParams = queryParamsAsString<InclusionConnectLogoutQueryParams>({
      client_id: this.inclusionConnectConfig.clientId,
      post_logout_redirect_uri: this.immersionBaseUrl,
    });

    return Promise.resolve<AbsoluteUrl>(
      `${this.inclusionConnectConfig.inclusionConnectBaseUri}/logout/?${queryParams}`,
    );
  }
}
