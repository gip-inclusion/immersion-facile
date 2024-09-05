import { expectToEqual, queryParamsAsString } from "shared";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../unit-of-work/adapters/createInMemoryUow";
import {
  InMemoryOAuthGateway,
  fakeProviderConfig,
} from "../adapters/oauth-gateway/InMemoryOAuthGateway";
import { oAuthGatewayModes } from "../port/OAuthGateway";
import { GetInclusionConnectLogoutUrl } from "./GetInclusionConnectLogoutUrl";

describe("GetInclusionConnectLogoutUrl", () => {
  describe.each(oAuthGatewayModes)("With OAuthGateway mode '%s'", (mode) => {
    let uow: InMemoryUnitOfWork;
    let getInclusionConnectLogoutUrl: GetInclusionConnectLogoutUrl;

    beforeEach(() => {
      uow = createInMemoryUow();
      getInclusionConnectLogoutUrl = new GetInclusionConnectLogoutUrl(
        new InMemoryUowPerformer(uow),
        new InMemoryOAuthGateway(fakeProviderConfig),
      );

      uow.featureFlagRepository.update({
        flagName: "enableProConnect",
        featureFlag: { isActive: mode === "ProConnect", kind: "boolean" },
      });
    });

    it("returns the inclusion connect logout url from %s", async () => {
      const logoutSuffixe =
        mode === "ProConnect" ? "pro-connect" : "inclusion-connect";
      expectToEqual(
        await getInclusionConnectLogoutUrl.execute(),
        `${
          fakeProviderConfig.providerBaseUri
        }/logout-${logoutSuffixe}?${queryParamsAsString({
          postLogoutRedirectUrl:
            fakeProviderConfig.immersionRedirectUri.afterLogout,
          clientId: fakeProviderConfig.clientId,
        })}`,
      );
    });
  });
});
