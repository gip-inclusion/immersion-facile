import {
  WithSourcePage,
  allowedStartInclusionConnectLoginPages,
  expectToEqual,
  queryParamsAsString,
} from "shared";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../../unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  InMemoryOAuthGateway,
  fakeInclusionConnectConfig,
} from "../adapters/oauth-gateway/InMemoryOAuthGateway";
import { oAuthGatewayModes } from "../port/OAuthGateway";
import { InitiateInclusionConnect } from "./InitiateInclusionConnect";

describe("InitiateInclusionConnect usecase", () => {
  describe.each(oAuthGatewayModes)("With OAuthGateway mode '%s'", (mode) => {
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
          new InMemoryOAuthGateway(fakeInclusionConnectConfig),
        );
        uow.featureFlagRepository.update({
          flagName: "enableProConnect",
          featureFlag: { isActive: mode === "ProConnect", kind: "boolean" },
        });

        uuidGenerator.setNextUuids([nonce, state]);

        const sourcePage: WithSourcePage = {
          page,
        };
        const redirectUrl = await useCase.execute(sourcePage);

        expectToEqual(
          redirectUrl,
          encodeURI(
            `${
              mode === "InclusionConnect"
                ? fakeInclusionConnectConfig.inclusionConnectBaseUri
                : fakeInclusionConnectConfig.proConnectBaseUri
            }/login?${queryParamsAsString({
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
              mode === "InclusionConnect" ? "inclusionConnect" : "proConnect",
            externalId: undefined,
            accessToken: undefined,
          },
        ]);
      },
    );
  });
});
