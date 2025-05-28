import {
  type AbsoluteUrl,
  AgencyDtoBuilder,
  type Email,
  type InclusionConnectImmersionRoutes,
  allowedStartOAuthLoginPages,
  decodeJwtWithoutSignatureCheck,
  decodeURIParams,
  displayRouteName,
  errors,
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
import {
  fakeProConnectSiret,
  fakeProviderConfig,
} from "../../../../domains/core/authentication/inclusion-connect/adapters/oauth-gateway/InMemoryOAuthGateway";
import type { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import type { UuidGenerator } from "../../../../domains/core/uuid-generator/ports/UuidGenerator";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  type InMemoryGateways,
  buildTestApp,
} from "../../../../utils/buildTestApp";

describe("user connexion flow", () => {
  const state = "my-state";
  const nonce = "nounce"; // matches the one in payload;
  const immersionDomain = "immersion.fr";
  const authCode = "pro-connect-auth-code";
  const proConnectToken = "pro-connect-token";
  const idToken = "pro-connect-id-token";
  const sub = "osef";

  let httpClient: HttpClient<InclusionConnectImmersionRoutes>;
  let uuidGenerator: UuidGenerator;
  let gateways: InMemoryGateways;
  let eventCrawler: BasicEventCrawler;
  let inMemoryUow: InMemoryUnitOfWork;
  let appConfig: AppConfig;

  beforeEach(async () => {
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

  describe("Right path with Proconnect", () => {
    describe("handle all allowed user connection pages", () => {
      it.each(allowedStartOAuthLoginPages)(
        `${displayRouteName(
          inclusionConnectImmersionRoutes.startInclusionConnectLogin,
        )} 302 > [ProConnect]/login-pro-connect - 302 > ${displayRouteName(
          inclusionConnectImmersionRoutes.afterLoginRedirection,
        )} 302 > page %s with required connected user params`,
        async (page) => {
          const generatedUserId = "my-user-id";
          const uuids = [nonce, state, generatedUserId];
          uuidGenerator.new = () => uuids.shift() ?? "no-uuid-provided";

          expectHttpResponseToEqual(
            await httpClient.startInclusionConnectLogin({
              queryParams: { page },
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

          gateways.oAuthGateway.setAccessTokenResponse({
            accessToken: proConnectToken,
            idToken,
            expire: 1,
            payload: {
              email: "osef@gmail",
              firstName: "osef",
              lastName: "jean",
              nonce,
              sub,
              siret: fakeProConnectSiret,
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
          const { userId } = decodeJwtWithoutSignatureCheck<{
            userId: string;
          }>(locationHeader.replace(locationPrefix, ""));
          expect(userId).toBe(generatedUserId);
          expectToEqual(inMemoryUow.ongoingOAuthRepository.ongoingOAuths, [
            {
              provider: "proConnect",
              userId: generatedUserId,
              nonce,
              state,
              usedAt: gateways.timeGateway.now(),
              externalId: "osef",
              accessToken: proConnectToken,
            },
          ]);
        },
      );
    });

    it("should link the agency if a code safir matches an agency with ProConnect", async () => {
      const generatedUserId = "my-user-id";
      const uuids = [nonce, state, generatedUserId];
      uuidGenerator.new = () => uuids.shift() ?? "no-uuid-provided";

      expectHttpResponseToEqual(
        await httpClient.startInclusionConnectLogin({
          queryParams: { page: "agencyDashboard" },
        }),
        {
          body: {},
          status: 302,
          headers: {
            location: encodeURI(
              `${
                appConfig.proConnectConfig.providerBaseUri
              }/login-pro-connect?${queryParamsAsString({
                page: "agencyDashboard",
                nonce,
                state,
              })}`,
            ),
          },
        },
      );

      const codeSafir = "my-safir-code";
      const agency = new AgencyDtoBuilder().withCodeSafir(codeSafir).build();

      inMemoryUow.agencyRepository.agencies = [toAgencyWithRights(agency)];

      gateways.oAuthGateway.setAccessTokenResponse({
        accessToken: proConnectToken,
        expire: 1,
        idToken,
        payload: {
          email: "osef@gmail",
          firstName: "osef",
          lastName: "jean",
          nonce,
          structure_pe: codeSafir,
          siret: fakeProConnectSiret,
          sub: sub,
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

  describe("Right path with email", () => {
    describe("handle all allowed user connection pages", () => {
      it.each(allowedStartOAuthLoginPages)(
        `${displayRouteName(
          inclusionConnectImmersionRoutes.initiateLoginByEmail,
        )} 200 | EMAIL with connexion link > ${displayRouteName(
          inclusionConnectImmersionRoutes.afterLoginRedirection,
        )} 302 > page %s with required connected user params`,
        async (page) => {
          const email: Email = "mail@email.com";
          const generatedUserId = "my-user-id";
          const uuids = [
            nonce,
            state,
            "aaaaaaaaaaa",
            "aaaaaaaaaab",
            generatedUserId,
          ];
          uuidGenerator.new = () => uuids.shift() ?? "no-uuid-provided";

          expectHttpResponseToEqual(
            await httpClient.initiateLoginByEmail({
              body: { email, page },
            }),
            {
              body: "",
              status: 200,
            },
          );

          await eventCrawler.processNewEvents();

          const notifications =
            inMemoryUow.notificationRepository.notifications;

          expect(notifications.length).toBe(1);
          const notification = notifications.at(0);
          if (!notification) throw new Error("missing notifification");
          if (notification.templatedContent.kind !== "LOGIN_BY_EMAIL_REQUESTED")
            throw new Error("bads notificiation kind");

          const code = decodeURIParams(
            notification.templatedContent.params.loginLink,
          )?.code;
          if (!code)
            throw new Error(
              `missing code on url ${notification.templatedContent.params.loginLink}`,
            );
          const response = await httpClient.afterLoginRedirection({
            queryParams: {
              code,
              state,
              page,
            },
          });

          expectHttpResponseToEqual(response, {
            body: {},
            status: 302,
          });
          const locationHeader = response.headers.location as AbsoluteUrl;
          const locationPrefix = `${appConfig.immersionFacileBaseUrl}/${frontRoutes[page]}?token=`;

          expect(locationHeader).toContain(locationPrefix);

          const token = decodeURIParams(locationHeader)?.token;
          if (!token)
            throw new Error(`Missing token param on url ${locationHeader}`);
          expectToEqual(
            decodeJwtWithoutSignatureCheck<{
              userId: string;
            }>(token).userId,
            generatedUserId,
          );

          expectToEqual(inMemoryUow.userRepository.users, [
            {
              id: generatedUserId,
              createdAt: gateways.timeGateway.now().toISOString(),
              email,
              firstName: "",
              lastName: "",
              proConnect: null,
            },
          ]);

          expectToEqual(inMemoryUow.ongoingOAuthRepository.ongoingOAuths, [
            {
              provider: "email",
              userId: generatedUserId,
              nonce,
              state,
              usedAt: gateways.timeGateway.now(),
              email,
            },
          ]);
        },
      );
    });
  });
});
