import { expectToEqual } from "shared";
import { GetInclusionConnectLogoutUrl } from "./GetInclusionConnectLogoutUrl";
import { InclusionConnectConfig } from "./InitiateInclusionConnect";

describe("GetInclusionConnectLogoutUrl", () => {
  it("returns the inclusion connect logout url", async () => {
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
      await getIcLogoutUrl.execute(),
      `${inclusionConnectConfig.inclusionConnectBaseUri}/logout/?client_id=${inclusionConnectConfig.clientId}&post_logout_redirect_uri=${baseUrl}/agence-dashboard`,
    );
  });
});
