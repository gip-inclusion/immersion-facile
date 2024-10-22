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
import { OngoingOAuth } from "../entities/OngoingOAuth";
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
        const ongoingOAuth: OngoingOAuth = {
          state: "some-state",
          nonce: "some-nonce",
          provider: "proConnect",
          userId: user.id,
          externalId: user.externalId ?? undefined,
          accessToken: "fake-access-token",
        };
        uow.ongoingOAuthRepository.ongoingOAuths = [ongoingOAuth];
        const logoutSuffixe =
          ongoingOAuth.provider === "proConnect"
            ? "pro-connect"
            : "inclusion-connect";
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
            state: ongoingOAuth.state,
          })}`,
        );
      });
    },
  );
});
