import { z } from "zod";
import { AbsoluteUrl, frontRoutes, queryParamsAsString } from "shared";
import { InclusionConnectLogoutQueryParams } from "../../../adapters/secondary/InclusionConnectGateway/inclusionConnectExternalRoutes";
import { UseCase } from "../../core/UseCase";
import { InclusionConnectConfig } from "./InitiateInclusionConnect";

export class GetInclusionConnectLogoutUrl extends UseCase<void, AbsoluteUrl> {
  protected inputSchema = z.void();

  constructor(
    private immersionBaseUrl: AbsoluteUrl,
    private inclusionConnectConfig: InclusionConnectConfig,
  ) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async _execute(): Promise<AbsoluteUrl> {
    const redirectUrl =
      `${this.immersionBaseUrl}/${frontRoutes.agencyDashboard}` as AbsoluteUrl;

    const queryParams = queryParamsAsString<InclusionConnectLogoutQueryParams>({
      client_id: this.inclusionConnectConfig.clientId,
      post_logout_redirect_uri: redirectUrl,
    });

    return `${this.inclusionConnectConfig.inclusionConnectBaseUri}/logout/?${queryParams}`;
  }
}
