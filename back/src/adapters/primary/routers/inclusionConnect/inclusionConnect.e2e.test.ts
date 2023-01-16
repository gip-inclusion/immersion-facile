import {
  AbsoluteUrl,
  AuthenticateWithInclusionCodeConnectParams,
  decodeJwtWithoutSignatureCheck,
  frontRoutes,
  inclusionConnectImmersionTargets,
  queryParamsAsString,
} from "shared";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import {
  buildTestApp,
  TestAppAndDeps,
} from "../../../../_testBuilders/buildTestApp";
import {
  defaultInclusionAccessTokenResponse,
  jwtGeneratedTokenFromFakeInclusionPayload,
} from "../../../secondary/InclusionConnectGateway/InMemoryInclusionConnectGateway";

const clientId = "my-client-id";
const clientSecret = "my-client-secret";
const from = "immersion-facilité";
const scope = "openid profile email";
const state = "my-state";
const nonce = "my-nonce";
const domain = "immersion-uri.com";
const responseType = "code" as const;
const inclusionConnectBaseUri: AbsoluteUrl =
  "http://fake-inclusion-connect-uri.com";

describe("inclusion connection flow", () => {
  let testAppAndDeps: TestAppAndDeps;
  describe("Right path", () => {
    it("does successfully the complete inclusion connect flow", async () => {
      testAppAndDeps = await buildTestApp(
        new AppConfigBuilder({
          INCLUSION_CONNECT_CLIENT_SECRET: clientSecret,
          INCLUSION_CONNECT_CLIENT_ID: clientId,
          INCLUSION_CONNECT_BASE_URI: inclusionConnectBaseUri,
          DOMAIN: domain,
        }).build(),
      );

      await expectTriggeringInclusionConnectFlowToRedirectToCorrectUrl();
      const authCode = "inclusion-auth-code";
      await redirectionAfterInclusionConnection({ code: authCode, state });
    });
  });
  // eslint-disable-next-line @typescript-eslint/no-empty-function, jest/no-disabled-tests
  describe.skip("Wrong path", () => {});

  const expectTriggeringInclusionConnectFlowToRedirectToCorrectUrl =
    async () => {
      const uuids = [nonce, state];
      testAppAndDeps.uuidGenerator.new = () =>
        uuids.shift() ?? "no-uuid-provided";

      const response = await testAppAndDeps.request.get(
        inclusionConnectImmersionTargets.startInclusionConnectLogin.url,
      );

      expect(response.status).toBe(302);
      expect(response.header).toMatchObject({
        location: encodeURI(
          `${inclusionConnectBaseUri}/auth?${[
            `client_id=${clientId}`,
            `from=${from}`,
            `nonce=${nonce}`,
            `redirect_uri=https://${domain}/api${inclusionConnectImmersionTargets.afterLoginRedirection.url}`,
            `response_type=${responseType}`,
            `scope=${scope}`,
            `state=${state}`,
          ].join("&")}`,
        ),
      });
    };

  const redirectionAfterInclusionConnection = async (
    params: AuthenticateWithInclusionCodeConnectParams,
  ) => {
    const inclusionToken = "inclusion-token";
    testAppAndDeps.gateways.inclusionConnectGateway.setAccessTokenResponse({
      ...defaultInclusionAccessTokenResponse,
      access_token: inclusionToken,
      id_token: jwtGeneratedTokenFromFakeInclusionPayload,
    });
    const response = await testAppAndDeps.request.get(
      `${
        inclusionConnectImmersionTargets.afterLoginRedirection.url
      }?${queryParamsAsString(params)}`,
    );

    expect(response.status).toBe(302);
    expect(response.header.location).toContain(
      `https://${domain}/${frontRoutes.agencyDashboard}?token=`,
    );

    const token = response.header.location.replace(
      `https://${domain}/${frontRoutes.agencyDashboard}?token=`,
      "",
    );

    expect(
      typeof decodeJwtWithoutSignatureCheck<{ userId: string }>(token).userId,
    ).toBe("string");
  };
});
