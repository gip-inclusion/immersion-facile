import { AxiosInstance } from "axios";
import {
  configureHttpClient,
  createAxiosHandlerCreator,
  CreateTargets,
  createTargets,
  Target,
} from "http-client";
import { AbsoluteUrl } from "shared";
import {
  InclusionConnectGetAccessTokenBody,
  InclusionConnectLogoutQueryParams,
} from "./inclusionConnectApi.dto";

type InclusionConnectTargetsConfig = {
  inclusionConnectBaseUrl: AbsoluteUrl;
};

export type InclusionConnectExternalTargets = CreateTargets<{
  inclusionConnectGetAccessToken: Target<InclusionConnectGetAccessTokenBody>;
  inclusionConnectLogout: Target<void, InclusionConnectLogoutQueryParams>;
}>;

export const makeInclusionConnectHttpClient = (
  axiosInstance: AxiosInstance,
  inclusionConnectConfig: InclusionConnectTargetsConfig,
) =>
  configureHttpClient(
    createAxiosHandlerCreator(axiosInstance),
  )<InclusionConnectExternalTargets>(
    createTargets<InclusionConnectExternalTargets>({
      // url should be of form: "https://{hostname}/realms/{realm-name}/protocol/openid-connect" then we add auth | token | logout,
      inclusionConnectGetAccessToken: {
        method: "POST",
        url: `${inclusionConnectConfig.inclusionConnectBaseUrl}/token`,
      },
      inclusionConnectLogout: {
        method: "GET",
        url: `${inclusionConnectConfig.inclusionConnectBaseUrl}/logout`,
      },
    }),
  );
