import {
  type WithRedirectUri,
  allowedStartOAuthLoginPages,
  expectToEqual,
  queryParamsAsString,
} from "shared";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../../unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  InMemoryOAuthGateway,
  fakeProviderConfig,
} from "../adapters/oauth-gateway/InMemoryOAuthGateway";
import { InitiateInclusionConnect } from "./InitiateInclusionConnect";

describe("InitiateInclusionConnect usecase", () => {
  describe("With OAuthGateway mode 'proConnect'", () => {
    it.each(allowedStartOAuthLoginPages)(
      "construct redirect url for %s with expected query params, and stores nounce and state in ongoingOAuth",
      async (page) => {
        const state = "my-state";
        const nonce = "my-nonce";
        const uow = createInMemoryUow();
        const uuidGenerator = new TestUuidGenerator();
        const useCase = new InitiateInclusionConnect(
          new InMemoryUowPerformer(uow),
          uuidGenerator,
          new InMemoryOAuthGateway(fakeProviderConfig),
        );

        uuidGenerator.setNextUuids([nonce, state]);

        const sourcePage: WithRedirectUri = {
          redirectUri: `/${page}?discussionId=discussion0`,
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
      },
    );
  });
});
