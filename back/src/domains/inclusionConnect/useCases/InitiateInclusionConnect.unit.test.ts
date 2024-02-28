import {
  AbsoluteUrl,
  WithSourcePage,
  allowedStartInclusionConnectLoginPages,
  expectToEqual,
  queryParamsAsString,
} from "shared";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { InitiateInclusionConnect } from "./InitiateInclusionConnect";

const clientId = "my-client-id";
const clientSecret = "my-client-secret";
const scope = "openid profile email";
const state = "my-state";
const nonce = "my-nonce";
const responseType = "code" as const;
const immersionBaseUri: AbsoluteUrl = "http://immersion-uri.com";
const inclusionConnectBaseUri: AbsoluteUrl =
  "http://fake-inclusion-connect-uri.com";

describe("InitiateInclusionConnect usecase", () => {
  it.each(allowedStartInclusionConnectLoginPages)(
    "construct redirect url for %s with expected query params, and stores nounce and state in ongoingOAuth",
    async (page) => {
      const uow = createInMemoryUow();
      const uuidGenerator = new TestUuidGenerator();
      const immersionRedirectUri: AbsoluteUrl = `${immersionBaseUri}/my-redirection`;
      const useCase = new InitiateInclusionConnect(
        new InMemoryUowPerformer(uow),
        uuidGenerator,
        {
          immersionRedirectUri,
          inclusionConnectBaseUri,
          scope,
          clientId,
          clientSecret,
        },
      );

      uuidGenerator.setNextUuids([nonce, state]);

      const sourcePage: WithSourcePage = {
        page,
      };
      const redirectUrl = await useCase.execute(sourcePage);

      expect(redirectUrl).toBe(
        encodeURI(
          `${inclusionConnectBaseUri}/auth?${[
            `client_id=${clientId}`,
            `nonce=${nonce}`,
            `redirect_uri=${immersionRedirectUri}?${queryParamsAsString<WithSourcePage>(
              sourcePage,
            )}`,
            `response_type=${responseType}`,
            `scope=${scope}`,
            `state=${state}`,
          ].join("&")}`,
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
