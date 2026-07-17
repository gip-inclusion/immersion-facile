import {
  allowedLoginUris,
  expectToEqual,
  type InitiateLoginByOAuthParams,
  type OAuthProviderForLogin,
  oAuthProvidersForLogin,
  queryParamsAsString,
} from "shared";
import { createInMemoryUow } from "../../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  fakeProviderConfig,
  InMemoryProConnectOAuthGateway,
} from "../adapters/oauth-gateway/InMemoryOAuthGateway";
import { makeInitiateLoginByOAuth } from "./InitiateLoginByOAuth";

describe("InitiateLoginByOAuth usecase", () => {
  describe.each(
    oAuthProvidersForLogin,
  )("With OAuthGateway mode '%s'", (provider: OAuthProviderForLogin) => {
    it.each(
      allowedLoginUris,
    )("construct redirect url for %s with expected query params, and stores nounce and state in ongoingOAuth", async (uri) => {
      const state = "my-state";
      const nonce = "my-nonce";
      const uow = createInMemoryUow();
      const uuidGenerator = new TestUuidGenerator();
      const useCase = makeInitiateLoginByOAuth({
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: {
          uuidGenerator,
          oAuthGateways: {
            proConnect: new InMemoryProConnectOAuthGateway(fakeProviderConfig),
            peConnect: new InMemoryProConnectOAuthGateway(fakeProviderConfig),
          },
        },
      });

      uuidGenerator.setNextUuids([nonce, state]);

      const sourcePage: InitiateLoginByOAuthParams = {
        redirectUri: `/${uri}?discussionId=discussion0`,
        provider,
      };
      const redirectUrl = await useCase.execute(sourcePage);
      const loginEndpoint = "login";

      expectToEqual(
        redirectUrl,
        encodeURI(
          `${
            fakeProviderConfig.providerBaseUri
          }/${loginEndpoint}?${queryParamsAsString({
            nonce,
            state,
          })}`,
        ),
      );

      expectToEqual(uow.ongoingOAuthRepository.ongoingOAuths, [
        {
          fromUri: sourcePage.redirectUri,
          nonce,
          state,
          provider,
          externalId: undefined,
          accessToken: undefined,
          usedAt: null,
          idToken: null,
        },
      ]);
    });
  });
});
