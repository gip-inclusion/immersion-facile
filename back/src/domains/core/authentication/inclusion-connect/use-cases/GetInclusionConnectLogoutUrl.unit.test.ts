import { expectToEqual, queryParamsAsString } from "shared";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../unit-of-work/adapters/createInMemoryUow";
import {
  InMemoryOAuthGateway,
  fakeInclusionConnectConfig,
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
        new InMemoryOAuthGateway(fakeInclusionConnectConfig),
      );

      uow.featureFlagRepository.update({
        flagName: "enableProConnect",
        featureFlag: { isActive: mode === "ProConnect", kind: "boolean" },
      });
    });

    it("returns the inclusion connect logout url from %s", async () => {
      expectToEqual(
        await getInclusionConnectLogoutUrl.execute(),
        `${
          mode === "InclusionConnect"
            ? fakeInclusionConnectConfig.inclusionConnectBaseUri
            : fakeInclusionConnectConfig.proConnectBaseUri
        }/logout?${queryParamsAsString({
          postLogoutRedirectUrl:
            fakeInclusionConnectConfig.immersionRedirectUri.afterLogout,
          clientId: fakeInclusionConnectConfig.clientId,
        })}`,
      );
    });
  });
});
