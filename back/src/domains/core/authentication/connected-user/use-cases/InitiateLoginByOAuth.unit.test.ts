import {
  allowedLoginUris,
  expectToEqual,
  type InitiateLoginByOAuthParams,
  queryParamsAsString,
} from "shared";
import { createInMemoryUow } from "../../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  fakeProviderConfig,
  InMemoryOAuthGateway,
} from "../adapters/oauth-gateway/InMemoryOAuthGateway";
import { InitiateLoginByOAuth } from "./InitiateLoginByOAuth";

describe("InitiateLoginByOAuth usecase", () => {
  describe("With OAuthGateway mode 'proConnect'", () => {
    // TODO : implement forEach with FTConnect
    it.each(
      allowedLoginUris,
    )("construct redirect url for %s with expected query params, and stores nounce and state in ongoingOAuth", async (uri) => {
      const state = "my-state";
      const nonce = "my-nonce";
      const uow = createInMemoryUow();
      const uuidGenerator = new TestUuidGenerator();
      const useCase = new InitiateLoginByOAuth(
        new InMemoryUowPerformer(uow),
        uuidGenerator,
        {
          proConnect: new InMemoryOAuthGateway(fakeProviderConfig),
          peConnect: new InMemoryOAuthGateway(fakeProviderConfig),
        },
      );

      uuidGenerator.setNextUuids([nonce, state]);

      const sourcePage: InitiateLoginByOAuthParams = {
        redirectUri: `/${uri}?discussionId=discussion0`,
        provider: "proConnect",
      };
      const redirectUrl = await useCase.execute(sourcePage);
      const loginEndpoint = "login-pro-connect";

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
          provider: "proConnect",
          externalId: undefined,
          accessToken: undefined,
          usedAt: null,
        },
      ]);
    });
  });
});
