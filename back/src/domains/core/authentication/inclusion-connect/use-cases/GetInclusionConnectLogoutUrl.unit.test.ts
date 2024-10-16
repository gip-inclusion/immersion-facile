import {
  expectToEqual,
  oAuthGatewayProviders,
  queryParamsAsString,
} from "shared";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../unit-of-work/adapters/createInMemoryUow";
import {
  InMemoryOAuthGateway,
  fakeProviderConfig,
} from "../adapters/oauth-gateway/InMemoryOAuthGateway";
import {
  GetInclusionConnectLogoutUrl,
  makeGetInclusionConnectLogoutUrl,
} from "./GetInclusionConnectLogoutUrl";

describe("GetInclusionConnectLogoutUrl", () => {
  describe.each(oAuthGatewayProviders)(
    "With OAuthGateway provider '%s'",
    (provider) => {
      let uow: InMemoryUnitOfWork;
      let getInclusionConnectLogoutUrl: GetInclusionConnectLogoutUrl;

      beforeEach(() => {
        uow = createInMemoryUow();
        getInclusionConnectLogoutUrl = makeGetInclusionConnectLogoutUrl({
          uowPerformer: new InMemoryUowPerformer(uow),
          deps: {
            oAuthGateway: new InMemoryOAuthGateway(fakeProviderConfig),
          },
        });

        uow.featureFlagRepository.update({
          flagName: "enableProConnect",
          featureFlag: { isActive: provider === "ProConnect", kind: "boolean" },
        });
      });

      it("returns the inclusion connect logout url from %s", async () => {
        const logoutSuffixe =
          provider === "ProConnect" ? "pro-connect" : "inclusion-connect";
        const idToken = "fake-id-token";
        expectToEqual(
          await getInclusionConnectLogoutUrl.execute({
            idToken,
          }),
          `${
            fakeProviderConfig.providerBaseUri
          }/logout-${logoutSuffixe}?${queryParamsAsString({
            postLogoutRedirectUrl:
              fakeProviderConfig.immersionRedirectUri.afterLogout,
            clientId: fakeProviderConfig.clientId,
            idToken,
          })}`,
        );
      });
    },
  );
});
