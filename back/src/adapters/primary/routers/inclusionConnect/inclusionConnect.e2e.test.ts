import {
  AgencyDtoBuilder,
  AllowedStartInclusionConnectLoginSourcesKind,
  InclusionConnectImmersionRoutes,
  WithSourcePage,
  allowedStartInclusionConnectLoginPages,
  decodeJwtWithoutSignatureCheck,
  displayRouteName,
  expectHttpResponseToEqual,
  expectToEqual,
  frontRoutes,
  inclusionConnectImmersionRoutes,
  queryParamsAsString,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { SuperTest, Test } from "supertest";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { fakeProviderConfig } from "../../../../domains/core/authentication/inclusion-connect/adapters/oauth-gateway/InMemoryOAuthGateway";
import { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { UuidGenerator } from "../../../../domains/core/uuid-generator/ports/UuidGenerator";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { InMemoryGateways, buildTestApp } from "../../../../utils/buildTestApp";

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
                appConfig.inclusionConnectConfig.providerBaseUri
              }/login-inclusion-connect?${queryParamsAsString({
                page,
                nonce,
                state,
              })}`,
            ),
          },
        },
      );
    });

    it.each(allowedStartInclusionConnectLoginPages)(
      `${displayRouteName(
        inclusionConnectImmersionRoutes.afterLoginRedirection,
      )} 302 redirect to %s with inclusion connect token`,
      async (page) => {
        const authCode = "inclusion-auth-code";
        const inclusionToken = "inclusion-token";
        gateways.oAuthGateway.setAccessTokenResponse({
          accessToken: inclusionToken,
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

      inMemoryUow.agencyRepository.agencies = [agency];

      const authCode = "inclusion-auth-code";
      const inclusionToken = "inclusion-token";
      const sub = "osef";
      gateways.oAuthGateway.setAccessTokenResponse({
        accessToken: inclusionToken,
        expire: 1,
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

      const icUser = await inMemoryUow.userRepository.getById(
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        user!.id,
      );

      expectToEqual(icUser?.agencyRights, [
        { agency, roles: ["validator"], isNotifiedByEmail: false },
      ]);
    });
  });
});
