import {
  type AbsoluteUrl,
  AgencyDtoBuilder,
  type AuthRoutes,
  allowedLoginUris,
  authExpiredMessage,
  authRoutes,
  ConventionDtoBuilder,
  currentJwtVersions,
  decodeJwtWithoutSignatureCheck,
  decodeURIWithParams,
  defaultProConnectInfos,
  displayRouteName,
  type Email,
  errors,
  expectHttpResponseToEqual,
  expectToEqual,
  queryParamsAsString,
  toAgencyDtoForAgencyUsersAndAdmins,
  type User,
  UserBuilder,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import type { SuperTest, Test } from "supertest";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { invalidTokenMessage } from "../../../../config/bootstrap/connectedUserAuthMiddleware";
import {
  fakeProConnectLogoutUri,
  fakeProConnectSiret,
  fakeProviderConfig,
} from "../../../../domains/core/authentication/connected-user/adapters/oauth-gateway/InMemoryOAuthGateway";
import type { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import type { GenerateConnectedUserJwt } from "../../../../domains/core/jwt";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import type { UuidGenerator } from "../../../../domains/core/uuid-generator/ports/UuidGenerator";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  buildTestApp,
  type InMemoryGateways,
} from "../../../../utils/buildTestApp";

describe("user connexion flow", () => {
  const state = "my-state";
  const nonce = "nounce"; // matches the one in payload;
  const immersionDomain = "immersion.fr";
  const authCode = "pro-connect-auth-code";
  const proConnectToken = "pro-connect-token";
  const idToken = "pro-connect-id-token";
  const sub = "osef";

  let httpClient: HttpClient<AuthRoutes>;
  let uuidGenerator: UuidGenerator;
  let gateways: InMemoryGateways;
  let eventCrawler: BasicEventCrawler;
  let inMemoryUow: InMemoryUnitOfWork;
  let appConfig: AppConfig;
  let generateConnectedUserJwt: GenerateConnectedUserJwt;

  beforeEach(async () => {
    let request: SuperTest<Test>;

    ({
      uuidGenerator,
      gateways,
      request,
      eventCrawler,
      inMemoryUow,
      appConfig,
      generateConnectedUserJwt,
    } = await buildTestApp(
      new AppConfigBuilder({
        PRO_CONNECT_GATEWAY: "IN_MEMORY",
        PRO_CONNECT_CLIENT_SECRET: fakeProviderConfig.clientSecret,
        PRO_CONNECT_CLIENT_ID: fakeProviderConfig.clientId,
        PRO_CONNECT_BASE_URI: fakeProviderConfig.providerBaseUri,
        DOMAIN: immersionDomain,
      }).build(),
    ));
    httpClient = createSupertestSharedClient(authRoutes, request);
  });

  describe("Right path with Proconnect", () => {
    describe("handle all allowed user connection pages", () => {
      it.each(allowedLoginUris)(
        `${displayRouteName(
          authRoutes.initiateLoginByOAuth,
        )} 302 > [ProConnect]/login-pro-connect - 302 > ${displayRouteName(
          authRoutes.afterOAuthSuccessRedirection,
        )} 302 > page %s with required connected user params`,
        async (page) => {
          const generatedUserId = "my-user-id";
          const uuids = [nonce, state, generatedUserId];
          uuidGenerator.new = () => uuids.shift() ?? "no-uuid-provided";

          const redirectUri = `/${page}?discussionId=discussion0`;

          expectHttpResponseToEqual(
            await httpClient.initiateLoginByOAuth({
              queryParams: {
                redirectUri,
              },
            }),
            {
              body: {},
              status: 302,
              headers: {
                location: encodeURI(
                  `${
                    appConfig.proConnectConfig.providerBaseUri
                  }/login-pro-connect?${queryParamsAsString({
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

          const response = await httpClient.afterOAuthSuccessRedirection({
            queryParams: {
              code: authCode,
              state,
            },
          });

          expectHttpResponseToEqual(response, {
            body: {},
            status: 302,
          });

          if (response.status !== 302)
            throw errors.generic.testError("Response must be 302");
          const locationHeader = response.headers.location as string;
          const locationPrefix = `${appConfig.immersionFacileBaseUrl}${redirectUri}&token=`;

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
              fromUri: redirectUri,
            },
          ]);
        },
      );
    });

    it("throws an error if the redirect uri is not allowed", async () => {
      const response = await httpClient.initiateLoginByOAuth({
        queryParams: {
          redirectUri: "@example.com",
        },
      });

      expectHttpResponseToEqual(response, {
        body: {
          status: 400,
          issues: ["redirectUri : redirectUri is not allowed"],
          message:
            "Shared-route schema 'queryParamsSchema' was not respected in adapter 'express'.\nRoute: GET /login/oauth",
        },
        status: 400,
      });
    });

    it("should link the agency if a code safir matches an agency with ProConnect", async () => {
      const generatedUserId = "my-user-id";
      const uuids = [nonce, state, generatedUserId];
      uuidGenerator.new = () => uuids.shift() ?? "no-uuid-provided";

      expectHttpResponseToEqual(
        await httpClient.initiateLoginByOAuth({
          queryParams: {
            redirectUri: "/tableau-de-bord-agence/agences/agencyId",
          },
        }),
        {
          body: {},
          status: 302,
          headers: {
            location: encodeURI(
              `${
                appConfig.proConnectConfig.providerBaseUri
              }/login-pro-connect?${queryParamsAsString({
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

      const response = await httpClient.afterOAuthSuccessRedirection({
        queryParams: {
          code: authCode,
          state,
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
      it.each(allowedLoginUris)(
        `${displayRouteName(
          authRoutes.initiateLoginByEmail,
        )} 200 | EMAIL with connexion link > ${displayRouteName(
          authRoutes.afterOAuthSuccessRedirection,
        )} 302 > page %s with required connected user params`,
        async (uri) => {
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
              body: { email, redirectUri: `/${uri}` },
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

          const code = decodeURIWithParams(
            notification.templatedContent.params.loginLink,
          ).params?.code;

          if (!code)
            throw new Error(
              `missing code on url ${notification.templatedContent.params.loginLink}`,
            );
          const response = await httpClient.afterOAuthSuccessRedirection({
            queryParams: {
              code,
              state,
            },
          });

          expectHttpResponseToEqual(response, {
            body: {},
            status: 302,
          });
          const locationHeader = response.headers.location as AbsoluteUrl;
          const redirectUrl: AbsoluteUrl = `${appConfig.immersionFacileBaseUrl}/${uri}`;
          const locationPrefix = `${redirectUrl}?token=`;

          expect(locationHeader).toContain(locationPrefix);

          const token = decodeURIWithParams(locationHeader).params?.token;

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
              lastLoginAt: gateways.timeGateway.now().toISOString(),
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
              fromUri: `/${uri}`,
            },
          ]);
        },
      );
    });
  });

  describe("/inclusion-connected/user", () => {
    const agency = new AgencyDtoBuilder().withKind("pole-emploi").build();
    const agencyForUsers = toAgencyDtoForAgencyUsersAndAdmins(agency, []);
    const agencyUser: User = {
      id: "123",
      email: "joe@mail.com",
      firstName: "Joe",
      lastName: "Doe",
      proConnect: defaultProConnectInfos,
      createdAt: new Date().toISOString(),
    };
    it(`${displayRouteName(
      authRoutes.getConnectedUser,
    )} 200 with agency dashboard url on response body`, async () => {
      const convention = new ConventionDtoBuilder()
        .withEstablishmentRepresentativeEmail(agencyUser.email)
        .build();

      inMemoryUow.conventionRepository.setConventions([convention]);
      inMemoryUow.userRepository.users = [agencyUser];
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [agencyUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
        }),
      ];

      const response = await httpClient.getConnectedUser({
        queryParams: {},
        headers: {
          authorization: generateConnectedUserJwt({
            userId: agencyUser.id,
            version: currentJwtVersions.connectedUser,
          }),
        },
      });

      expectHttpResponseToEqual(response, {
        body: {
          ...agencyUser,
          dashboards: {
            agencies: {
              agencyDashboardUrl: `http://stubAgencyUserDashboard/${
                agencyUser.id
              }/${gateways.timeGateway.now()}`,
              erroredConventionsDashboardUrl: `http://stubErroredConventionDashboard/${
                agencyUser.id
              }/${gateways.timeGateway.now()}`,
              statsAgenciesUrl: `http://stubStatsAgenciesDashboard/${gateways.timeGateway.now()}/${agency.kind}`,
              statsEstablishmentDetailsUrl: `http://stubStatsEstablishmentDetailsDashboard/${gateways.timeGateway.now()}`,
              statsConventionsByEstablishmentByDepartmentUrl: `http://stubStatsConventionsByEstablishmentByDepartmentDashboard/${gateways.timeGateway.now()}`,
            },
            establishments: {
              conventions: `http://stubEstablishmentConventionsDashboardUrl/${
                agencyUser.id
              }/${gateways.timeGateway.now()}`,
            },
          },
          agencyRights: [
            {
              agency: agencyForUsers,
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
          ],
        },
        status: 200,
      });
    });

    it(`${displayRouteName(
      authRoutes.getConnectedUser,
    )} 400 without headers`, async () => {
      const response = await httpClient.getConnectedUser({
        headers: {} as any,
        queryParams: {},
      });
      expectHttpResponseToEqual(response, {
        body: {
          issues: [
            "authorization : Invalid input: expected string, received undefined",
          ],
          message:
            "Shared-route schema 'headersSchema' was not respected in adapter 'express'.\nRoute: GET /inclusion-connected/user",
          status: 400,
        },
        status: 400,
      });
    });

    it(`${displayRouteName(
      authRoutes.getConnectedUser,
    )} 401 with bad token`, async () => {
      const response = await httpClient.getConnectedUser({
        headers: { authorization: "wrong-token" },
        queryParams: {},
      });

      expectHttpResponseToEqual(response, {
        body: { message: invalidTokenMessage, status: 401 },
        status: 401,
      });
    });

    it(`${displayRouteName(
      authRoutes.getConnectedUser,
    )} 401 with expired token`, async () => {
      const userId = "123";
      const token = generateConnectedUserJwt(
        { userId, version: currentJwtVersions.connectedUser },
        0,
      );

      const response = await httpClient.getConnectedUser({
        headers: { authorization: token },
        queryParams: {},
      });

      expectHttpResponseToEqual(response, {
        body: { message: authExpiredMessage, status: 401 },
        status: 401,
      });
    });
  });

  describe(`${displayRouteName(
    authRoutes.getOAuthLogoutUrl,
  )} returns the logout url`, () => {
    it("returns 401 if not logged in", async () => {
      const response = await httpClient.getOAuthLogoutUrl({
        queryParams: { idToken: "fake-id-token" },
        headers: { authorization: "" },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: {
          status: 401,
          message: "Veuillez vous authentifier",
        },
      });
    });

    it("returns a correct logout url with status 200", async () => {
      const user = new UserBuilder()
        .withProConnectInfos({ externalId: "id", siret: "00000000000000" })
        .build();

      inMemoryUow.userRepository.users = [user];
      const state = "fake-state";
      inMemoryUow.ongoingOAuthRepository.ongoingOAuths = [
        {
          fromUri: "uri",
          userId: user.id,
          accessToken: "yolo",
          provider: "proConnect",
          state,
          nonce: "fake-nonce",
          externalId: user.proConnect?.externalId,
          usedAt: null,
        },
      ];

      const token = generateConnectedUserJwt({
        userId: user.id,
        version: currentJwtVersions.connectedUser,
      });

      const response = await httpClient.getOAuthLogoutUrl({
        headers: { authorization: token },
        queryParams: {
          idToken: "fake-id-token",
        },
      });

      expectHttpResponseToEqual(response, {
        body: `${
          appConfig.proConnectConfig.providerBaseUri
        }${fakeProConnectLogoutUri}?${queryParamsAsString({
          postLogoutRedirectUrl: appConfig.immersionFacileBaseUrl,
          idToken: "fake-id-token",
          state,
        })}`,
        status: 200,
      });
    });
  });
});
