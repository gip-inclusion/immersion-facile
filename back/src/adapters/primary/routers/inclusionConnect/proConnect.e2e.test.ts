import {
  type AllowedStartInclusionConnectLoginSourcesKind,
  type InclusionConnectImmersionRoutes,
  type WithSourcePage,
  allowedStartOAuthLoginPages,
  decodeJwtWithoutSignatureCheck,
  displayRouteName,
  errors,
  expectHttpResponseToEqual,
  frontRoutes,
  inclusionConnectImmersionRoutes,
  queryParamsAsString,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import type { SuperTest, Test } from "supertest";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { fakeProviderConfig } from "../../../../domains/core/authentication/inclusion-connect/adapters/oauth-gateway/InMemoryOAuthGateway";
import type { UuidGenerator } from "../../../../domains/core/uuid-generator/ports/UuidGenerator";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import {
  type InMemoryGateways,
  buildTestApp,
} from "../../../../utils/buildTestApp";

describe("proConnect flow", () => {
  const state = "my-state";
  const nonce = "nounce"; // matches the one in payload;
  const immersionDomain = "immersion.fr";

  let httpClient: HttpClient<InclusionConnectImmersionRoutes>;
  let uuidGenerator: UuidGenerator;
  let gateways: InMemoryGateways;
  let appConfig: AppConfig;

  describe("Right path", () => {
    beforeAll(async () => {
      let request: SuperTest<Test>;

      ({ uuidGenerator, gateways, request, appConfig } = await buildTestApp(
        new AppConfigBuilder({
          PRO_CONNECT_GATEWAY: "IN_MEMORY",
          PRO_CONNECT_CLIENT_SECRET: fakeProviderConfig.clientSecret,
          PRO_CONNECT_CLIENT_ID: fakeProviderConfig.clientId,
          PRO_CONNECT_BASE_URI: fakeProviderConfig.providerBaseUri,
          DOMAIN: immersionDomain,
        }).build(),
      ));
      httpClient = createSupertestSharedClient(
        inclusionConnectImmersionRoutes,
        request,
      );
    });

    it(`${displayRouteName(
      inclusionConnectImmersionRoutes.startInclusionConnectLogin,
    )} 302 redirect to pro connect login url with right parameters in url`, async () => {
      const uuids = [nonce, state];
      uuidGenerator.new = () => uuids.shift() ?? "no-uuid-provided";

      const page: AllowedStartInclusionConnectLoginSourcesKind =
        "establishmentDashboard";
      const queryParams: WithSourcePage = {
        page,
      };

      expectHttpResponseToEqual(
        await httpClient.startInclusionConnectLogin({
          queryParams,
        }),
        {
          body: {},
          status: 302,
          headers: {
            location: encodeURI(
              `${
                appConfig.proConnectConfig.providerBaseUri
              }/login-pro-connect?${queryParamsAsString({
                page,
                nonce,
                state,
              })}`,
            ),
          },
        },
      );
    });

    it.each(allowedStartOAuthLoginPages)(
      `${displayRouteName(
        inclusionConnectImmersionRoutes.afterLoginRedirection,
      )} 302 redirect to %s with pro connect token`,
      async (page) => {
        const authCode = "pro-connect-auth-code";
        const proConnectToken = "pro-connect-token";
        const idToken = "pro-connect-id-token";
        gateways.oAuthGateway.setAccessTokenResponse({
          accessToken: proConnectToken,
          idToken,
          expire: 1,
          payload: {
            email: "osef@gmail",
            firstName: "osef",
            lastName: "jean",
            nonce,
            sub: "osef",
          },
        });
        const response = await httpClient.afterLoginRedirection({
          queryParams: {
            code: authCode,
            state,
            page,
          },
        });

        expectHttpResponseToEqual(response, {
          body: {},
          status: 302,
        });

        if (response.status !== 302)
          throw errors.generic.testError("Response must be 302");
        const locationHeader = response.headers.location as string;
        const locationPrefix = `${appConfig.immersionFacileBaseUrl}/${frontRoutes[page]}?token=`;

        expect(locationHeader).toContain(locationPrefix);
        expect(
          typeof decodeJwtWithoutSignatureCheck<{ userId: string }>(
            locationHeader.replace(locationPrefix, ""),
          ).userId,
        ).toBe("string");
      },
    );
  });
});
