import {
  WithSourcePage,
  allowedStartInclusionConnectLoginPages,
  expectToEqual,
  oAuthGatewayProviders,
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
  describe.each(oAuthGatewayProviders)(
    "With OAuthGateway mode '%s'",
    (provider) => {
      it.each(allowedStartInclusionConnectLoginPages)(
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
          await uow.featureFlagRepository.update({
            flagName: "enableProConnect",
            featureFlag: {
              isActive: provider === "ProConnect",
              kind: "boolean",
            },
          });

          uuidGenerator.setNextUuids([nonce, state]);

          const sourcePage: WithSourcePage = {
            page,
          };
          const redirectUrl = await useCase.execute(sourcePage);
          const loginEndpoint =
            provider === "InclusionConnect"
              ? "login-inclusion-connect"
              : "login-pro-connect";

          expectToEqual(
            redirectUrl,
            encodeURI(
              `${
                fakeProviderConfig.providerBaseUri
              }/${loginEndpoint}?${queryParamsAsString({
                page,
                nonce,
                state,
              })}`,
            ),
          );

          expectToEqual(uow.ongoingOAuthRepository.ongoingOAuths, [
            {
              nonce,
              state,
              provider:
                provider === "InclusionConnect"
                  ? "inclusionConnect"
                  : "proConnect",
              externalId: undefined,
              accessToken: undefined,
            },
          ]);
        },
      );
    },
  );
});
