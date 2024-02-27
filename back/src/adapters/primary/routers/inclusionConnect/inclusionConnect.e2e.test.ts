import {
  AbsoluteUrl,
  AgencyDtoBuilder,
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
import { BasicEventCrawler } from "../../../../domain/core/events/adapters/EventCrawlerImplementations";
import { UuidGenerator } from "../../../../domain/core/uuid-generator/ports/UuidGenerator";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { InMemoryGateways, buildTestApp } from "../../../../utils/buildTestApp";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe("inclusion connection flow", () => {
  const clientId = "my-client-id";
  const clientSecret = "my-client-secret";
  const scope = "openid profile email";
  const state = "my-state";
  const nonce = "nounce"; // matches the one in payload;
  const domain = "immersion-uri.com";
  const responseType = "code" as const;
  const inclusionConnectBaseUri: AbsoluteUrl =
    "http://fake-inclusion-connect-uri.com";

  let httpClient: HttpClient<InclusionConnectImmersionRoutes>;
  let uuidGenerator: UuidGenerator;
  let gateways: InMemoryGateways;
  let eventCrawler: BasicEventCrawler;
  let inMemoryUow: InMemoryUnitOfWork;

  describe("Right path", () => {
    beforeAll(async () => {
      let request: SuperTest<Test>;
      ({ uuidGenerator, gateways, request, eventCrawler, inMemoryUow } =
        await buildTestApp(
          new AppConfigBuilder({
            INCLUSION_CONNECT_GATEWAY: "IN_MEMORY",
            INCLUSION_CONNECT_CLIENT_SECRET: clientSecret,
            INCLUSION_CONNECT_CLIENT_ID: clientId,
            INCLUSION_CONNECT_BASE_URI: inclusionConnectBaseUri,
            DOMAIN: domain,
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

      const queryParams: WithSourcePage = {
        page: "establishmentDashboard",
      };

      const response = await httpClient.startInclusionConnectLogin({
        queryParams,
      });

      expectHttpResponseToEqual(response, {
        body: {},
        status: 302,
        headers: {
          location: encodeURI(
            `${inclusionConnectBaseUri}/auth?${[
              `client_id=${clientId}`,
              `nonce=${nonce}`,
              `redirect_uri=https://${domain}/api${
                inclusionConnectImmersionRoutes.afterLoginRedirection.url
              }?${queryParamsAsString<WithSourcePage>(queryParams)}`,
              `response_type=${responseType}`,
              `scope=${scope}`,
              `state=${state}`,
            ].join("&")}`,
          ),
        },
      });
    });

    it.each(allowedStartInclusionConnectLoginPages)(
      `${displayRouteName(
        inclusionConnectImmersionRoutes.afterLoginRedirection,
      )} 302 redirect to %s with inclusion connect token`,
      async (page) => {
        const authCode = "inclusion-auth-code";
        const inclusionToken = "inclusion-token";
        gateways.inclusionConnectGateway.setAccessTokenResponse({
          accessToken: inclusionToken,
          expire: 1,
          icIdTokenPayload: {
            email: "osef@gmail",
            family_name: "osef",
            given_name: "jean",
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
        const locationPrefix = `https://${domain}/${frontRoutes[page]}?token=`;

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
      gateways.inclusionConnectGateway.setAccessTokenResponse({
        accessToken: inclusionToken,
        expire: 1,
        icIdTokenPayload: {
          email: "osef@gmail",
          family_name: "osef",
          given_name: "jean",
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

      const user =
        await inMemoryUow.authenticatedUserRepository.findByExternalId(sub);

      const icUser = await inMemoryUow.inclusionConnectedUserRepository.getById(
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        user!.id,
      );

      expectToEqual(icUser?.agencyRights, [{ agency, role: "validator" }]);
    });
  });
});
