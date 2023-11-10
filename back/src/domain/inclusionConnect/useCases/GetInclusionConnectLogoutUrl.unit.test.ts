import {
  allowedStartInclusionConnectLoginPages,
  expectToEqual,
  frontRoutes,
} from "shared";
import { GetInclusionConnectLogoutUrl } from "./GetInclusionConnectLogoutUrl";
import { InclusionConnectConfig } from "./InitiateInclusionConnect";

describe("GetInclusionConnectLogoutUrl", () => {
  it.each(allowedStartInclusionConnectLoginPages)(
    "returns the inclusion connect logout url from %s",
    async (page) => {
      const baseUrl = "http://my-base-url.com";
      const inclusionConnectConfig: InclusionConnectConfig = {
        clientId: "my-client-id",
        clientSecret: "my-client-secret",
        immersionRedirectUri: baseUrl,
        scope: "",
        inclusionConnectBaseUri: "http://my-inclusion-connect-base-url.com",
      };
      const getIcLogoutUrl = new GetInclusionConnectLogoutUrl(
        baseUrl,
        inclusionConnectConfig,
      );

      expectToEqual(
        await getIcLogoutUrl.execute({
          page,
        }),
        `${inclusionConnectConfig.inclusionConnectBaseUri}/logout/?client_id=${inclusionConnectConfig.clientId}&post_logout_redirect_uri=${baseUrl}/${frontRoutes[page]}`,
      );
    },
  );
});
