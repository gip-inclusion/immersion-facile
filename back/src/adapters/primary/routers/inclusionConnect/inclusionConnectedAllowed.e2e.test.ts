import { addDays } from "date-fns";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  DiscussionBuilder,
  type Exchange,
  type ExchangeMessageFromDashboard,
  type InclusionConnectedAllowedRoutes,
  InclusionConnectedUserBuilder,
  type User,
  connectedUserTokenExpiredMessage,
  currentJwtVersions,
  defaultProConnectInfos,
  displayRouteName,
  errors,
  expectArraysToMatch,
  expectHttpResponseToEqual,
  expectToEqual,
  inclusionConnectedAllowedRoutes,
  queryParamsAsString,
  toAgencyDtoForAgencyUsersAndAdmins,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import type { SuperTest, Test } from "supertest";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { invalidTokenMessage } from "../../../../config/bootstrap/inclusionConnectAuthMiddleware";
import type { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import type { GenerateConnectedUserJwt } from "../../../../domains/core/jwt";
import { broadcastToFtLegacyServiceName } from "../../../../domains/core/saved-errors/ports/BroadcastFeedbacksRepository";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { EstablishmentAggregateBuilder } from "../../../../domains/establishment/helpers/EstablishmentBuilders";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  type InMemoryGateways,
  buildTestApp,
} from "../../../../utils/buildTestApp";

describe("InclusionConnectedAllowedRoutes", () => {
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

  let httpClient: HttpClient<InclusionConnectedAllowedRoutes>;
  let generateConnectedUserJwt: GenerateConnectedUserJwt;
  let inMemoryUow: InMemoryUnitOfWork;
  let gateways: InMemoryGateways;
  let eventCrawler: BasicEventCrawler;
  let appConfig: AppConfig;

  beforeEach(async () => {
    let request: SuperTest<Test>;
    ({
      request,
      generateConnectedUserJwt,
      inMemoryUow,
      gateways,
      eventCrawler,
      appConfig,
    } = await buildTestApp());
    httpClient = createSupertestSharedClient(
      inclusionConnectedAllowedRoutes,
      request,
    );
  });

  describe("/inclusion-connected/user", () => {
    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.getInclusionConnectedUser,
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

      const response = await httpClient.getInclusionConnectedUser({
        queryParams: {},
        headers: {
          authorization: generateConnectedUserJwt({
            userId: agencyUser.id,
            version: currentJwtVersions.inclusion,
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
      inclusionConnectedAllowedRoutes.getInclusionConnectedUser,
    )} 400 without headers`, async () => {
      const response = await httpClient.getInclusionConnectedUser({
        headers: {} as any,
        queryParams: {},
      });
      expectHttpResponseToEqual(response, {
        body: {
          issues: ["authorization : Required"],
          message:
            "Shared-route schema 'headersSchema' was not respected in adapter 'express'.\nRoute: GET /inclusion-connected/user",
          status: 400,
        },
        status: 400,
      });
    });

    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.getInclusionConnectedUser,
    )} 401 with bad token`, async () => {
      const response = await httpClient.getInclusionConnectedUser({
        headers: { authorization: "wrong-token" },
        queryParams: {},
      });

      expectHttpResponseToEqual(response, {
        body: { message: invalidTokenMessage, status: 401 },
        status: 401,
      });
    });

    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.getInclusionConnectedUser,
    )} 401 with expired token`, async () => {
      const userId = "123";
      const token = generateConnectedUserJwt(
        { userId, version: currentJwtVersions.inclusion },
        0,
      );

      const response = await httpClient.getInclusionConnectedUser({
        headers: { authorization: token },
        queryParams: {},
      });

      expectHttpResponseToEqual(response, {
        body: { message: connectedUserTokenExpiredMessage, status: 401 },
        status: 401,
      });
    });
  });

  describe("/inclusion-connected/register-agency", () => {
    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.registerAgenciesToUser,
    )} 200 add an agency as registered to an Inclusion Connected user`, async () => {
      inMemoryUow.userRepository.users = [agencyUser];
      inMemoryUow.agencyRepository.agencies = [toAgencyWithRights(agency)];

      const response = await httpClient.registerAgenciesToUser({
        headers: {
          authorization: generateConnectedUserJwt({
            userId: agencyUser.id,
            version: currentJwtVersions.inclusion,
          }),
        },
        body: [agency.id],
      });

      expectHttpResponseToEqual(response, {
        body: "",
        status: 200,
      });

      expectToEqual(inMemoryUow.userRepository.users, [agencyUser]);
      expectToEqual(inMemoryUow.agencyRepository.agencies, [
        toAgencyWithRights(agency, {
          [agencyUser.id]: {
            isNotifiedByEmail: false,
            roles: ["to-review"],
          },
        }),
      ]);
    });

    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.registerAgenciesToUser,
    )} 400 without headers`, async () => {
      const response = await httpClient.registerAgenciesToUser({
        body: ["1"],
        headers: {} as any,
      });
      expectHttpResponseToEqual(response, {
        body: {
          issues: ["authorization : Required"],
          message:
            "Shared-route schema 'headersSchema' was not respected in adapter 'express'.\nRoute: POST /inclusion-connected/register-agency",
          status: 400,
        },
        status: 400,
      });
    });
  });

  describe("Mark partners errored convention as handled", () => {
    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.markPartnersErroredConventionAsHandled,
    )} 400 without headers`, async () => {
      const response = await httpClient.markPartnersErroredConventionAsHandled({
        headers: {} as any,
        body: { conventionId: "11111111-1111-4111-1111-111111111111" },
      });
      expectHttpResponseToEqual(response, {
        body: {
          issues: ["authorization : Required"],
          message:
            "Shared-route schema 'headersSchema' was not respected in adapter 'express'.\nRoute: POST /inclusion-connected/mark-errored-convention-as-handled",
          status: 400,
        },
        status: 400,
      });
    });

    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.markPartnersErroredConventionAsHandled,
    )} 401 with bad token`, async () => {
      const response = await httpClient.markPartnersErroredConventionAsHandled({
        headers: { authorization: "wrong-token" },
        body: { conventionId: "11111111-1111-4111-1111-111111111111" },
      });
      expectHttpResponseToEqual(response, {
        body: { message: invalidTokenMessage, status: 401 },
        status: 401,
      });
    });

    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.markPartnersErroredConventionAsHandled,
    )} 401 with expired token`, async () => {
      const userId = "123";
      const token = generateConnectedUserJwt(
        { userId, version: currentJwtVersions.inclusion },
        0,
      );
      const response = await httpClient.markPartnersErroredConventionAsHandled({
        headers: { authorization: token },
        body: { conventionId: "11111111-1111-4111-1111-111111111111" },
      });
      expectHttpResponseToEqual(response, {
        body: { message: connectedUserTokenExpiredMessage, status: 401 },
        status: 401,
      });
    });

    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.markPartnersErroredConventionAsHandled,
    )} 403 when user has no rights on agency`, async () => {
      const userAgency = new AgencyDtoBuilder().withId("agency-id-1").build();
      const conventionAgency = new AgencyDtoBuilder()
        .withId("agency-id-2")
        .build();
      const conventionId = "11111111-1111-4111-1111-111111111111";
      const user: User = {
        id: "123456ab",
        email: "joe@mail.com",
        firstName: "Joe",
        lastName: "Doe",
        proConnect: defaultProConnectInfos,
        createdAt: new Date().toISOString(),
      };
      const token = generateConnectedUserJwt({
        userId: user.id,
        version: currentJwtVersions.inclusion,
      });
      const convention = new ConventionDtoBuilder()
        .withId(conventionId)
        .withAgencyId(conventionAgency.id)
        .build();
      inMemoryUow.userRepository.users = [user];
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(userAgency, {
          [user.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
        toAgencyWithRights(conventionAgency),
      ];
      inMemoryUow.conventionRepository.setConventions([convention]);

      const response = await httpClient.markPartnersErroredConventionAsHandled({
        headers: { authorization: token },
        body: { conventionId: "11111111-1111-4111-1111-111111111111" },
      });

      expectHttpResponseToEqual(response, {
        body: {
          status: 403,
          message: errors.user.noRightsOnAgency({
            userId: "123456ab",
            agencyId: "agency-id-2",
          }).message,
        },
        status: 403,
      });
    });

    it("mark partners errored convention as handled", async () => {
      const conventionId = "11111111-1111-4111-1111-111111111111";
      const agency = new AgencyDtoBuilder().build();
      const user: User = {
        id: "123456ab",
        email: "joe@mail.com",
        firstName: "Joe",
        lastName: "Doe",
        proConnect: defaultProConnectInfos,
        createdAt: new Date().toISOString(),
      };
      const convention = new ConventionDtoBuilder()
        .withId(conventionId)
        .withAgencyId(agency.id)
        .build();
      inMemoryUow.userRepository.users = [user];
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [user.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      ];
      inMemoryUow.conventionRepository.setConventions([convention]);
      await inMemoryUow.broadcastFeedbacksRepository.save({
        serviceName: broadcastToFtLegacyServiceName,
        consumerName: "France Travail",
        consumerId: null,
        subscriberErrorFeedback: { message: "Some message" },
        requestParams: { conventionId },
        response: { httpStatus: 500 },
        occurredAt: new Date("2023-10-26T12:00:00.000"),
        handledByAgency: false,
      });
      const token = generateConnectedUserJwt({
        userId: user.id,
        version: currentJwtVersions.inclusion,
      });

      const response = await httpClient.markPartnersErroredConventionAsHandled({
        headers: { authorization: token },
        body: { conventionId: convention.id },
      });
      expectHttpResponseToEqual(response, { body: "", status: 200 });
      expectToEqual(
        inMemoryUow.broadcastFeedbacksRepository.broadcastFeedbacks,
        [
          {
            serviceName: broadcastToFtLegacyServiceName,
            consumerName: "France Travail",
            consumerId: null,
            subscriberErrorFeedback: {
              message: "Some message",
            },
            requestParams: { conventionId },
            response: { httpStatus: 500 },
            occurredAt: new Date("2023-10-26T12:00:00.000"),
            handledByAgency: true,
          },
        ],
      );
    });

    describe(`${displayRouteName(
      inclusionConnectedAllowedRoutes.getInclusionConnectLogoutUrl,
    )} returns the logout url`, () => {
      it("returns 401 if not logged in", async () => {
        const response = await httpClient.getInclusionConnectLogoutUrl({
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
        inMemoryUow.userRepository.users = [agencyUser];
        const state = "fake-state";
        inMemoryUow.ongoingOAuthRepository.ongoingOAuths = [
          {
            userId: agencyUser.id,
            accessToken: "yolo",
            provider: "proConnect",
            state,
            nonce: "fake-nonce",
            externalId: agencyUser.proConnect?.externalId,
            usedAt: null,
          },
        ];

        const token = generateConnectedUserJwt({
          userId: agencyUser.id,
          version: currentJwtVersions.inclusion,
        });
        const response = await httpClient.getInclusionConnectLogoutUrl({
          headers: { authorization: token },
          queryParams: {
            idToken: "fake-id-token",
          },
        });

        expectHttpResponseToEqual(response, {
          body: `${
            appConfig.proConnectConfig.providerBaseUri
          }/logout-pro-connect?${queryParamsAsString({
            postLogoutRedirectUrl: appConfig.immersionFacileBaseUrl,
            idToken: "fake-id-token",
            state,
          })}`,
          status: 200,
        });
      });
    });

    describe(`${displayRouteName(
      inclusionConnectedAllowedRoutes.getDiscussionByIdForEstablishment,
    )} returns the discussion`, () => {
      it("gets the discussion for the establishment", async () => {
        const user: User = {
          id: "11111111-1111-4111-1111-111111111111",
          email: "user@mail.com",
          firstName: "User",
          lastName: "Name",
          proConnect: defaultProConnectInfos,
          createdAt: new Date().toISOString(),
        };
        const discussion = new DiscussionBuilder()
          .withEstablishmentContact(user)
          .build();

        inMemoryUow.discussionRepository.discussions = [discussion];
        inMemoryUow.userRepository.users = [user];

        const token = generateConnectedUserJwt({
          userId: user.id,
          version: currentJwtVersions.inclusion,
        });

        const response = await httpClient.getDiscussionByIdForEstablishment({
          headers: { authorization: token },
          urlParams: { discussionId: discussion.id },
        });

        expectHttpResponseToEqual(response, {
          status: 200,
          body: new DiscussionBuilder(discussion).buildRead(),
        });
      });
    });
  });
  describe("update discussion status", () => {
    describe(`${displayRouteName(
      inclusionConnectedAllowedRoutes.updateDiscussionStatus,
    )}`, () => {
      it("400 - throws if discussion is already rejected", async () => {
        const user = new InclusionConnectedUserBuilder().buildUser();
        const discussion = new DiscussionBuilder()
          .withEstablishmentContact({
            email: user.email,
          })
          .withStatus({
            status: "REJECTED",
            rejectionKind: "UNABLE_TO_HELP",
            candidateWarnedMethod: null,
          })
          .build();
        const existingToken = generateConnectedUserJwt({
          userId: user.id,
          version: currentJwtVersions.inclusion,
        });
        inMemoryUow.discussionRepository.discussions = [discussion];
        inMemoryUow.userRepository.users = [user];

        const response = await httpClient.updateDiscussionStatus({
          headers: { authorization: existingToken },
          urlParams: {
            discussionId: discussion.id,
          },
          body: {
            status: "REJECTED",
            rejectionKind: "OTHER",
            rejectionReason: "No reason",
            candidateWarnedMethod: null,
          },
        });

        expectHttpResponseToEqual(response, {
          status: 400,
          body: {
            message: errors.discussion.alreadyRejected({
              discussionId: discussion.id,
            }).message,
            status: 400,
          },
        });
      });
      it("401 - throws if user is not known", async () => {
        const discussion = new DiscussionBuilder().build();

        inMemoryUow.discussionRepository.discussions = [discussion];

        const response = await httpClient.updateDiscussionStatus({
          headers: { authorization: "" },
          urlParams: {
            discussionId: discussion.id,
          },
          body: {
            status: "REJECTED",
            rejectionKind: "OTHER",
            rejectionReason: "No reason",
            candidateWarnedMethod: null,
          },
        });

        expectHttpResponseToEqual(response, {
          status: 401,
          body: {
            message: "Veuillez vous authentifier",
            status: 401,
          },
        });
      });
      it("403 - throws if user is not bound to discussion", async () => {
        const user = new InclusionConnectedUserBuilder().buildUser();
        const discussion = new DiscussionBuilder().build();
        const existingToken = generateConnectedUserJwt({
          userId: user.id,
          version: currentJwtVersions.inclusion,
        });
        inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(discussion.siret)
            .withUserRights([
              {
                role: "establishment-admin",
                userId: "other",
                job: "",
                phone: "",
              },
            ])
            .build(),
        ];
        inMemoryUow.discussionRepository.discussions = [discussion];
        inMemoryUow.userRepository.users = [user];

        const response = await httpClient.updateDiscussionStatus({
          headers: { authorization: existingToken },
          urlParams: {
            discussionId: discussion.id,
          },
          body: {
            status: "REJECTED",
            rejectionKind: "OTHER",
            rejectionReason: "No reason",
            candidateWarnedMethod: null,
          },
        });
        expectHttpResponseToEqual(response, {
          status: 403,
          body: {
            message: errors.discussion.rejectForbidden({
              discussionId: discussion.id,
              userId: user.id,
            }).message,
            status: 403,
          },
        });
      });
      it("200 - rejects discussion", async () => {
        const user = new InclusionConnectedUserBuilder().buildUser();
        const discussion = new DiscussionBuilder()
          .withEstablishmentContact({
            email: user.email,
          })
          .build();
        const existingToken = generateConnectedUserJwt({
          userId: user.id,
          version: currentJwtVersions.inclusion,
        });
        inMemoryUow.discussionRepository.discussions = [discussion];
        inMemoryUow.userRepository.users = [user];

        gateways.timeGateway.defaultDate = addDays(
          new Date(discussion.createdAt),
          2,
        );

        const response = await httpClient.updateDiscussionStatus({
          headers: { authorization: existingToken },
          urlParams: {
            discussionId: discussion.id,
          },
          body: {
            status: "REJECTED",
            rejectionKind: "OTHER",
            rejectionReason: "No reason",
            candidateWarnedMethod: null,
          },
        });

        expectHttpResponseToEqual(response, {
          status: 200,
          body: "",
        });

        const emailSubject =
          "L’entreprise My default business name ne souhaite pas donner suite à votre candidature à l’immersion";

        expectArraysToMatch(inMemoryUow.outboxRepository.events, [
          {
            topic: "DiscussionStatusManuallyUpdated",
            payload: {
              discussion: {
                ...discussion,
                status: "REJECTED",
                rejectionKind: "OTHER",
                rejectionReason: "No reason",
                candidateWarnedMethod: null,
                exchanges: [
                  ...discussion.exchanges,
                  {
                    subject: emailSubject,
                    message: expect.any(String),
                    sender: "establishment",
                    recipient: "potentialBeneficiary",
                    sentAt: expect.any(String),
                    attachments: [],
                  },
                ],
              },
              triggeredBy: { kind: "inclusion-connected", userId: user.id },
            },
          },
        ]);

        await eventCrawler.processNewEvents();

        expectArraysToMatch(inMemoryUow.notificationRepository.notifications, [
          {
            kind: "email",
            templatedContent: {
              kind: "DISCUSSION_EXCHANGE",
              params: {
                htmlContent: expect.any(String),
                subject: emailSubject,
              },
              recipients: [discussion.potentialBeneficiary.email],
              cc: [],
              attachments: [],
            },
            followedIds: {
              userId: user.id,
              establishmentSiret: discussion.siret,
            },
          },
        ]);
      });
    });
  });
  describe(`${displayRouteName(
    inclusionConnectedAllowedRoutes.broadcastConventionAgain,
  )}`, () => {
    it("throws an error if user is not authenticated", async () => {
      const response = await httpClient.broadcastConventionAgain({
        headers: { authorization: "wrong-token" },
        body: { conventionId: "11111111-1111-4111-1111-111111111111" },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: { message: invalidTokenMessage, status: 401 },
      });
    });

    it("save the event to Broadcast Convention again, than it event triggers calling partners", async () => {
      const adminUser = new InclusionConnectedUserBuilder()
        .withIsAdmin(true)
        .buildUser();
      const validator = new InclusionConnectedUserBuilder()
        .withId("validator")
        .withEmail("validator@mail.com")
        .buildUser();

      inMemoryUow.userRepository.users = [adminUser, validator];

      const token = generateConnectedUserJwt({
        userId: adminUser.id,
        version: currentJwtVersions.inclusion,
      });

      const convention = new ConventionDtoBuilder().build();
      inMemoryUow.conventionRepository.setConventions([convention]);
      inMemoryUow.agencyRepository.insert(
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      );

      const response = await httpClient.broadcastConventionAgain({
        headers: { authorization: token },
        body: { conventionId: convention.id },
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: "",
      });

      expectArraysToMatch(inMemoryUow.outboxRepository.events, [
        { topic: "ConventionBroadcastRequested", status: "never-published" },
      ]);

      await eventCrawler.processNewEvents();

      expectArraysToMatch(inMemoryUow.outboxRepository.events, [
        { topic: "ConventionBroadcastRequested", status: "published" },
      ]);

      // TODO : when we store all partner responses, check that they have been called
    });
  });
  describe(`${displayRouteName(
    inclusionConnectedAllowedRoutes.replyToDiscussion,
  )}`, () => {
    it("200 - saves the exchange to a discussion", async () => {
      const user = new InclusionConnectedUserBuilder().buildUser();
      const payload: ExchangeMessageFromDashboard = {
        message: "My fake message",
      };
      const discussion = new DiscussionBuilder()
        .withEstablishmentContact({
          email: user.email,
        })
        .build();
      const existingToken = generateConnectedUserJwt({
        userId: user.id,
        version: currentJwtVersions.inclusion,
      });
      inMemoryUow.discussionRepository.discussions = [discussion];
      inMemoryUow.userRepository.users = [user];

      const response = await httpClient.replyToDiscussion({
        headers: { authorization: existingToken },
        urlParams: { discussionId: discussion.id },
        body: payload,
      });

      const expectedExchange: Exchange = {
        subject:
          "Réponse de My default business name à votre demande d'immersion",
        message: "My fake message",
        sentAt: "2021-09-01T10:10:00.000Z",
        sender: "establishment",
        recipient: "potentialBeneficiary",
        attachments: [],
      };

      expectHttpResponseToEqual(response, {
        status: 200,
        body: expectedExchange,
      });
      expectArraysToMatch(inMemoryUow.discussionRepository.discussions, [
        new DiscussionBuilder(discussion)
          .withExchanges([...discussion.exchanges, expectedExchange])
          .build(),
      ]);
    });
  });
});
