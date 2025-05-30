import {
  type User,
  defaultProConnectInfos,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  queryParamsAsString,
} from "shared";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../unit-of-work/adapters/createInMemoryUow";
import {
  InMemoryOAuthGateway,
  fakeProviderConfig,
} from "../adapters/oauth-gateway/InMemoryOAuthGateway";
import type { OngoingOAuth } from "../entities/OngoingOAuth";
import {
  type GetInclusionConnectLogoutUrl,
  makeGetInclusionConnectLogoutUrl,
} from "./GetInclusionConnectLogoutUrl";

const user: User = {
  id: "my-user-id",
  email: "user@mail.com",
  firstName: "User",
  lastName: "App",
  createdAt: new Date().toISOString(),
  proConnect: defaultProConnectInfos,
};

describe("GetInclusionConnectLogoutUrl", () => {
  describe("With OAuthGateway provider 'proConnect'", () => {
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
    });

    it("throws when it does not find the ongoingOAuth", async () => {
      uow.ongoingOAuthRepository.ongoingOAuths = [];
      await expectPromiseToFailWithError(
        getInclusionConnectLogoutUrl.execute({ idToken: "whatever" }, user),
        errors.inclusionConnect.missingOAuth({}),
      );
    });

    it("returns the oAuth logout url from %s", async () => {
      const ongoingOAuth: OngoingOAuth = {
        state: "some-state",
        nonce: "some-nonce",
        provider: "proConnect",
        userId: user.id,
        externalId: user.proConnect?.externalId,
        accessToken: "fake-access-token",
        usedAt: null,
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
          idToken,
          state: ongoingOAuth.state,
        })}`,
      );
    });
  });
});
