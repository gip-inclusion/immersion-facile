import { AbsoluteUrl, expectToEqual } from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InitiateInclusionConnect } from "./InitiateInclusionConnect";

const clientId = "my-client-id";
const clientSecret = "my-client-secret";
const from = "immersion-facilité";
const scope = "openid profile email";
const state = "my-state";
const nonce = "my-nonce";
const immersionRedirectUri: AbsoluteUrl = "http://immersion-uri.com";
const responseType = "code" as const;
const inclusionConnectBaseUri: AbsoluteUrl =
  "http://fake-inclusion-connect-uri.com";

describe("InitiateInclusionConnect usecase", () => {
  it("construct redirect url with expected query params, and stores nounce and state in ongoingOAuth", async () => {
    const uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    const uuidGenerator = new TestUuidGenerator();
    const initiateInclusionConnect = new InitiateInclusionConnect(
      uowPerformer,
      uuidGenerator,
      {
        immersionRedirectUri,
        inclusionConnectBaseUri,
        scope,
        clientId,
        from,
        clientSecret,
      },
    );

    uuidGenerator.setNextUuids([nonce, state]);

    const redirectUrl = await initiateInclusionConnect.execute();

    expect(redirectUrl).toBe(
      encodeURI(
        `${inclusionConnectBaseUri}/auth?${[
          `client_id=${clientId}`,
          `from=${from}`,
          `nonce=${nonce}`,
          `redirect_uri=${immersionRedirectUri}`,
          `response_type=${responseType}`,
          `scope=${scope}`,
          `state=${state}`,
        ].join("&")}`,
      ),
    );
    expect(uow.ongoingOAuthRepository.ongoingOAuths).toHaveLength(1);
    expectToEqual(uow.ongoingOAuthRepository.ongoingOAuths[0], {
      nonce,
      state,
      provider: "inclusionConnect",
      externalId: undefined,
      accessToken: undefined,
    });
  });
});
