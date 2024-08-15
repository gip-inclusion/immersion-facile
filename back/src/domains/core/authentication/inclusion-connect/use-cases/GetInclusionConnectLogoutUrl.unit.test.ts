import { expectToEqual, queryParamsAsString } from "shared";
import {
  InMemoryInclusionConnectGateway,
  fakeInclusionConnectConfig,
} from "../adapters/Inclusion-connect-gateway/InMemoryInclusionConnectGateway";
import { GetInclusionConnectLogoutUrl } from "./GetInclusionConnectLogoutUrl";

describe("GetInclusionConnectLogoutUrl", () => {
  it("returns the inclusion connect logout url from %s", async () => {
    const getIcLogoutUrl = new GetInclusionConnectLogoutUrl(
      new InMemoryInclusionConnectGateway(fakeInclusionConnectConfig),
    );

    expectToEqual(
      await getIcLogoutUrl.execute(),
      `${
        fakeInclusionConnectConfig.inclusionConnectBaseUri
      }/logout/?${queryParamsAsString({
        postLogoutRedirectUrl:
          fakeInclusionConnectConfig.immersionRedirectUri.afterLogout,
        clientId: fakeInclusionConnectConfig.clientId,
      })}`,
    );
  });
});
