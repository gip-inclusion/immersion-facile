import {
  AbsoluteUrl,
  GetInclusionConnectLogoutUrlQueryParams,
  frontRoutes,
  getInclusionConnectLogoutUrlQueryParamsSchema,
  queryParamsAsString,
} from "shared";
import { UseCase } from "../../../UseCase";
import { InclusionConnectLogoutQueryParams } from "../adapters/Inclusion-connect-gateway/inclusionConnectExternalRoutes";
import { InclusionConnectConfig } from "./InitiateInclusionConnect";

export class GetInclusionConnectLogoutUrl extends UseCase<
  GetInclusionConnectLogoutUrlQueryParams,
  AbsoluteUrl
> {
  protected inputSchema = getInclusionConnectLogoutUrlQueryParamsSchema;

  constructor(
    private immersionBaseUrl: AbsoluteUrl,
    private inclusionConnectConfig: InclusionConnectConfig,
  ) {
    super();
  }

  public async _execute(
    params: GetInclusionConnectLogoutUrlQueryParams,
  ): Promise<AbsoluteUrl> {
    const redirectUrl: AbsoluteUrl = `${this.immersionBaseUrl}/${
      frontRoutes[params.page]
    }`;

    const queryParams = queryParamsAsString<InclusionConnectLogoutQueryParams>({
      client_id: this.inclusionConnectConfig.clientId,
      post_logout_redirect_uri: redirectUrl,
    });

    return Promise.resolve<AbsoluteUrl>(
      `${this.inclusionConnectConfig.inclusionConnectBaseUri}/logout/?${queryParams}`,
    );
  }
}
