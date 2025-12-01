import {
  defaultProConnectInfos,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  queryParamsAsString,
  type User,
} from "shared";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  fakeProConnectLogoutUri,
  fakeProviderConfig,
  InMemoryOAuthGateway,
} from "../adapters/oauth-gateway/InMemoryOAuthGateway";
import type { OngoingOAuth } from "../entities/OngoingOAuth";
import {
  type GetOAuthLogoutUrl,
  makeGetOAuthLogoutUrl,
} from "./GetOAuthLogoutUrl";

describe("GetOAuthLogoutUrl", () => {
  const user: User = {
    id: "my-user-id",
    email: "user@mail.com",
    firstName: "User",
    lastName: "App",
    createdAt: new Date().toISOString(),
    proConnect: defaultProConnectInfos,
  };
  describe("With OAuthGateway provider 'proConnect'", () => {
    let uow: InMemoryUnitOfWork;
    let getOAuthLogoutUrl: GetOAuthLogoutUrl;

    beforeEach(() => {
      uow = createInMemoryUow();
      uow.userRepository.users = [user];
      getOAuthLogoutUrl = makeGetOAuthLogoutUrl({
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: {
          oAuthGateway: new InMemoryOAuthGateway(fakeProviderConfig),
        },
      });
    });

    it("throws when it does not find the ongoingOAuth", async () => {
      uow.ongoingOAuthRepository.ongoingOAuths = [];
      await expectPromiseToFailWithError(
        getOAuthLogoutUrl.execute({ idToken: "whatever" }, user),
        errors.auth.missingOAuth({}),
      );
    });

    it("returns the oAuth logout url from %s", async () => {
      const ongoingOAuth: OngoingOAuth = {
        fromUri: "/uri",
        state: "some-state",
        nonce: "some-nonce",
        provider: "proConnect",
        userId: user.id,
        externalId: user.proConnect?.externalId,
        accessToken: "fake-access-token",
        usedAt: null,
      };
      uow.ongoingOAuthRepository.ongoingOAuths = [ongoingOAuth];
      const idToken = "fake-id-token";
      expectToEqual(
        await getOAuthLogoutUrl.execute({ idToken }, user),
        `${
          fakeProviderConfig.providerBaseUri
        }${fakeProConnectLogoutUri}?${queryParamsAsString({
          postLogoutRedirectUrl:
            fakeProviderConfig.immersionRedirectUri.afterLogout,
          idToken,
          state: ongoingOAuth.state,
        })}`,
      );
    });
  });
});
