import {
  AgencyDtoBuilder,
  type AllowedStartInclusionConnectLoginSourcesKind,
  type IdToken,
  type InclusionConnectImmersionRoutes,
  type WithSourcePage,
  allowedStartOAuthLoginPages,
  decodeJwtWithoutSignatureCheck,
  displayRouteName,
  expectHttpResponseToEqual,
  expectToEqual,
  frontRoutes,
  inclusionConnectImmersionRoutes,
  queryParamsAsString,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import type { SuperTest, Test } from "supertest";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { fakeProviderConfig } from "../../../../domains/core/authentication/inclusion-connect/adapters/oauth-gateway/InMemoryOAuthGateway";
import type { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import type { UuidGenerator } from "../../../../domains/core/uuid-generator/ports/UuidGenerator";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  type InMemoryGateways,
  buildTestApp,
} from "../../../../utils/buildTestApp";

describe("inclusion connection flow", () => {
  const state = "my-state";
  const nonce = "nounce"; // matches the one in payload;
  const immersionDomain = "immersion.fr";

  let httpClient: HttpClient<InclusionConnectImmersionRoutes>;
  let uuidGenerator: UuidGenerator;
  let gateways: InMemoryGateways;
  let eventCrawler: BasicEventCrawler;
  let inMemoryUow: InMemoryUnitOfWork;
  let appConfig: AppConfig;

  describe("Right path", () => {
    beforeAll(async () => {
      let request: SuperTest<Test>;

      ({
        uuidGenerator,
        gateways,
        request,
        eventCrawler,
        inMemoryUow,
        appConfig,
      } = await buildTestApp(
        new AppConfigBuilder({
          INCLUSION_CONNECT_GATEWAY: "IN_MEMORY",
          INCLUSION_CONNECT_CLIENT_SECRET: fakeProviderConfig.clientSecret,
          INCLUSION_CONNECT_CLIENT_ID: fakeProviderConfig.clientId,
          INCLUSION_CONNECT_BASE_URI: fakeProviderConfig.providerBaseUri,
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
    )} 302 redirect to inclusion connect login url with right parameters in url`, async () => {
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
      )} 302 redirect to %s with inclusion connect token`,
      async (page) => {
        const authCode = "inclusion-auth-code";
        const inclusionToken = "inclusion-token";
        const idToken = "inclusion-id-token";
        gateways.oAuthGateway.setAccessTokenResponse({
          accessToken: inclusionToken,
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

        if (response.status !== 302) throw new Error("Response must be 302");
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

    it(`${displayRouteName(
      inclusionConnectImmersionRoutes.afterLoginRedirection,
    )} should link the agency if a code safir matches an agency`, async () => {
      const codeSafir = "my-safir-code";
      const agency = new AgencyDtoBuilder().withCodeSafir(codeSafir).build();

      inMemoryUow.agencyRepository.agencies = [toAgencyWithRights(agency)];

      const authCode = "inclusion-auth-code";
      const inclusionToken = "inclusion-token";
      const sub = "osef";
      const idToken: IdToken = "inclusion-connect-access-token";
      gateways.oAuthGateway.setAccessTokenResponse({
        accessToken: inclusionToken,
        expire: 1,
        idToken,
        payload: {
          email: "osef@gmail",
          firstName: "osef",
          lastName: "jean",
          nonce,
          structure_pe: codeSafir,
          sub,
        },
      });
      const response = await httpClient.afterLoginRedirection({
        queryParams: {
          code: authCode,
          state,
          page: "agencyDashboard",
        },
      });

      expectHttpResponseToEqual(response, {
        body: {},
        status: 302,
      });

      await eventCrawler.processNewEvents();

      const user = await inMemoryUow.userRepository.findByExternalId(sub);
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const userId = user!.id;

      expectToEqual(inMemoryUow.agencyRepository.agencies, [
        toAgencyWithRights(agency, {
          [userId]: { roles: ["validator"], isNotifiedByEmail: false },
        }),
      ]);
    });
  });
});
