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
  InMemoryInclusionConnectGateway,
  fakeInclusionConnectConfig,
} from "../adapters/Inclusion-connect-gateway/InMemoryInclusionConnectGateway";
import { InitiateInclusionConnect } from "./InitiateInclusionConnect";

describe("InitiateInclusionConnect usecase", () => {
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
        new InMemoryInclusionConnectGateway(fakeInclusionConnectConfig),
      );

      uuidGenerator.setNextUuids([nonce, state]);

      const sourcePage: WithSourcePage = {
        page,
      };
      const redirectUrl = await useCase.execute(sourcePage);

      expectToEqual(
        redirectUrl,
        encodeURI(
          `${
            fakeInclusionConnectConfig.inclusionConnectBaseUri
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
          provider: "inclusionConnect",
          externalId: undefined,
          accessToken: undefined,
        },
      ]);
    },
  );
});
