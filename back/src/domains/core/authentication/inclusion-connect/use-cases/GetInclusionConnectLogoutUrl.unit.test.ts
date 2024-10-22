import {
  User,
  errors,
  expectPromiseToFailWithError,
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

const user: User = {
  id: "my-user-id",
  email: "user@mail.com",
  firstName: "User",
  lastName: "App",
  createdAt: new Date().toISOString(),
  externalId: "user-external-id",
};

describe("GetInclusionConnectLogoutUrl", () => {
  describe.each(oAuthGatewayProviders)(
    "With OAuthGateway provider '%s'",
    (provider) => {
      let uow: InMemoryUnitOfWork;
      let getInclusionConnectLogoutUrl: GetInclusionConnectLogoutUrl;

      beforeEach(() => {
        uow = createInMemoryUow();
        uow.userRepository.users = [user];
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

      it("throws when it does not find the ongoingOAuth", async () => {
        uow.ongoingOAuthRepository.ongoingOAuths = [];
        await expectPromiseToFailWithError(
          getInclusionConnectLogoutUrl.execute({ idToken: "whatever" }, user),
          errors.inclusionConnect.missingOAuth({}),
        );
      });

      it("returns the inclusion connect logout url from %s", async () => {
        uow.ongoingOAuthRepository.ongoingOAuths = [
          {
            state: "some-state",
            nonce: "some-nonce",
            provider: "proConnect",
            userId: user.id,
            externalId: user.externalId ?? undefined,
            accessToken: "fake-access-token",
          },
        ];
        const logoutSuffixe =
          provider === "ProConnect" ? "pro-connect" : "inclusion-connect";
        const idToken = "fake-id-token";
        expectToEqual(
          await getInclusionConnectLogoutUrl.execute({ idToken }, user),
          `${
            fakeProviderConfig.providerBaseUri
          }/logout-${logoutSuffixe}?${queryParamsAsString({
            postLogoutRedirectUrl:
              fakeProviderConfig.immersionRedirectUri.afterLogout,
            clientId: fakeProviderConfig.clientId,
            idToken,
            state: "some-state",
          })}`,
        );
      });
    },
  );
});
