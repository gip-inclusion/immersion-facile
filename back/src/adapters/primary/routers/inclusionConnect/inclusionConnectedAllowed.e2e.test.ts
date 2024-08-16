import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  DiscussionBuilder,
  InclusionConnectedAllowedRoutes,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  User,
  currentJwtVersions,
  displayRouteName,
  errors,
  expectArraysToMatch,
  expectHttpResponseToEqual,
  expectToEqual,
  inclusionConnectTokenExpiredMessage,
  inclusionConnectedAllowedRoutes,
  queryParamsAsString,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { SuperTest, Test } from "supertest";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { Gateways } from "../../../../config/bootstrap/createGateways";
import { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import { GenerateInclusionConnectJwt } from "../../../../domains/core/jwt";
import { broadcastToPeServiceName } from "../../../../domains/core/saved-errors/ports/BroadcastFeedbacksRepository";
import { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { buildTestApp } from "../../../../utils/buildTestApp";

describe("InclusionConnectedAllowedRoutes", () => {
  const userId = "123";
  const agency = new AgencyDtoBuilder().build();
  const inclusionConnectedUserWithoutRights: InclusionConnectedUser = {
    id: userId,
    email: "joe@mail.com",
    firstName: "Joe",
    lastName: "Doe",
    agencyRights: [],
    dashboards: { agencies: {}, establishments: {} },
    externalId: "joe-external-id",
    createdAt: new Date().toISOString(),
  };
  const inclusionConnectedUserWithRights: InclusionConnectedUser = {
    ...inclusionConnectedUserWithoutRights,
    agencyRights: [{ agency, roles: ["validator"], isNotifiedByEmail: false }],
  };

  let httpClient: HttpClient<InclusionConnectedAllowedRoutes>;
  let generateInclusionConnectJwt: GenerateInclusionConnectJwt;
  let inMemoryUow: InMemoryUnitOfWork;
  let gateways: Gateways;
  let eventCrawler: BasicEventCrawler;
  let appConfig: AppConfig;

  beforeEach(async () => {
    let request: SuperTest<Test>;
    ({
      request,
      generateInclusionConnectJwt,
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
        .withEstablishmentRepresentativeEmail(
          inclusionConnectedUserWithRights.email,
        )
        .build();

      inMemoryUow.conventionRepository.setConventions([convention]);

      inMemoryUow.userRepository.setInclusionConnectedUsers([
        inclusionConnectedUserWithRights,
      ]);

      const token = generateInclusionConnectJwt({
        userId,
        version: currentJwtVersions.inclusion,
      });

      const response = await httpClient.getInclusionConnectedUser({
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        body: {
          ...inclusionConnectedUserWithRights,
          dashboards: {
            agencies: {
              agencyDashboardUrl: `http://stubAgencyUserDashboard/${
                inclusionConnectedUserWithRights.id
              }/${gateways.timeGateway.now()}`,
              erroredConventionsDashboardUrl: `http://stubErroredConventionDashboard/${
                inclusionConnectedUserWithRights.id
              }/${gateways.timeGateway.now()}`,
            },
            establishments: {
              conventions: {
                url: `http://stubEstablishmentConventionsDashboardUrl/${
                  inclusionConnectedUserWithRights.id
                }/${gateways.timeGateway.now()}`,
                role: "establishment-representative",
              },
            },
          },
        },
        status: 200,
      });
    });

    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.getInclusionConnectedUser,
    )} 400 without headers`, async () => {
      const response = await httpClient.getInclusionConnectedUser({
        headers: {} as any,
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
      });

      expectHttpResponseToEqual(response, {
        body: { message: "Provided token is invalid", status: 401 },
        status: 401,
      });
    });

    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.getInclusionConnectedUser,
    )} 401 with expired token`, async () => {
      const userId = "123";
      const token = generateInclusionConnectJwt(
        { userId, version: currentJwtVersions.inclusion },
        0,
      );

      const response = await httpClient.getInclusionConnectedUser({
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        body: { message: inclusionConnectTokenExpiredMessage, status: 401 },
        status: 401,
      });
    });
  });

  describe("/inclusion-connected/register-agency", () => {
    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.registerAgenciesToUser,
    )} 200 add an agency as registered to an Inclusion Connected user`, async () => {
      inMemoryUow.userRepository.setInclusionConnectedUsers([
        inclusionConnectedUserWithoutRights,
      ]);
      inMemoryUow.agencyRepository.setAgencies([agency]);

      const response = await httpClient.registerAgenciesToUser({
        headers: {
          authorization: generateInclusionConnectJwt({
            userId,
            version: currentJwtVersions.inclusion,
          }),
        },
        body: [agency.id],
      });

      expectHttpResponseToEqual(response, {
        body: "",
        status: 200,
      });
      expectToEqual(await inMemoryUow.userRepository.getById(userId), {
        ...inclusionConnectedUserWithRights,
        agencyRights: [
          { agency, roles: ["toReview"], isNotifiedByEmail: false },
        ],
      });
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
        body: { message: "Provided token is invalid", status: 401 },
        status: 401,
      });
    });

    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.markPartnersErroredConventionAsHandled,
    )} 401 with expired token`, async () => {
      const userId = "123";
      const token = generateInclusionConnectJwt(
        { userId, version: currentJwtVersions.inclusion },
        0,
      );
      const response = await httpClient.markPartnersErroredConventionAsHandled({
        headers: { authorization: token },
        body: { conventionId: "11111111-1111-4111-1111-111111111111" },
      });
      expectHttpResponseToEqual(response, {
        body: { message: inclusionConnectTokenExpiredMessage, status: 401 },
        status: 401,
      });
    });

    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.markPartnersErroredConventionAsHandled,
    )} 403 when user has no rights on agency`, async () => {
      const userId = "123456ab";
      const userAgency = new AgencyDtoBuilder().withId("agency-id-1").build();
      const conventionAgency = new AgencyDtoBuilder()
        .withId("agency-id-2")
        .build();
      const conventionId = "11111111-1111-4111-1111-111111111111";
      const user: InclusionConnectedUser = {
        id: userId,
        email: "joe@mail.com",
        firstName: "Joe",
        lastName: "Doe",
        agencyRights: [
          {
            agency: userAgency,
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        ],
        dashboards: { agencies: {}, establishments: {} },
        externalId: "joe-external-id",
        createdAt: new Date().toISOString(),
      };
      const token = generateInclusionConnectJwt({
        userId,
        version: currentJwtVersions.inclusion,
      });
      const convention = new ConventionDtoBuilder()
        .withId(conventionId)
        .withAgencyId(conventionAgency.id)
        .build();
      inMemoryUow.userRepository.setInclusionConnectedUsers([user]);
      inMemoryUow.agencyRepository.setAgencies([userAgency, conventionAgency]);
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
      const userId = "123456ab";
      const conventionId = "11111111-1111-4111-1111-111111111111";
      const agency = new AgencyDtoBuilder().build();
      const user: InclusionConnectedUser = {
        id: userId,
        email: "joe@mail.com",
        firstName: "Joe",
        lastName: "Doe",
        agencyRights: [
          { agency, roles: ["validator"], isNotifiedByEmail: false },
        ],
        dashboards: { agencies: {}, establishments: {} },
        externalId: "joe-external-id",
        createdAt: new Date().toISOString(),
      };
      const convention = new ConventionDtoBuilder()
        .withId(conventionId)
        .withAgencyId(agency.id)
        .build();
      inMemoryUow.userRepository.setInclusionConnectedUsers([user]);
      inMemoryUow.agencyRepository.setAgencies([agency]);
      inMemoryUow.conventionRepository.setConventions([convention]);
      await inMemoryUow.broadcastFeedbacksRepository.save({
        serviceName: broadcastToPeServiceName,
        consumerName: "France Travail",
        consumerId: null,
        subscriberErrorFeedback: { message: "Some message" },
        requestParams: { conventionId },
        response: { httpStatus: 500 },
        occurredAt: new Date("2023-10-26T12:00:00.000"),
        handledByAgency: false,
      });
      const token = generateInclusionConnectJwt({
        userId,
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
            serviceName: broadcastToPeServiceName,
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
      it("returns a correct logout url with status 200", async () => {
        const response = await httpClient.getInclusionConnectLogoutUrl();
        expectHttpResponseToEqual(response, {
          body: `${
            appConfig.inclusionConnectConfig.inclusionConnectBaseUri
          }/logout?${queryParamsAsString({
            postLogoutRedirectUrl: appConfig.immersionFacileBaseUrl,
            clientId: appConfig.inclusionConnectConfig.clientId,
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
          externalId: "user-external-id",
          createdAt: new Date().toISOString(),
        };
        const discussion = new DiscussionBuilder()
          .withEstablishmentContact(user)
          .build();

        inMemoryUow.discussionRepository.discussions = [discussion];
        inMemoryUow.userRepository.users = [user];

        const token = generateInclusionConnectJwt({
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
  describe(`${displayRouteName(
    inclusionConnectedAllowedRoutes.updateDiscussionStatus,
  )}`, () => {
    it("400 - throws if discussion is already rejected", async () => {
      const user = new InclusionConnectedUserBuilder().build();
      const discussion = new DiscussionBuilder()
        .withEstablishmentContact({
          email: user.email,
        })
        .withStatus("REJECTED")
        .build();
      const existingToken = generateInclusionConnectJwt({
        userId: user.id,
        version: currentJwtVersions.inclusion,
      });
      inMemoryUow.discussionRepository.discussions = [discussion];
      inMemoryUow.userRepository.setInclusionConnectedUsers([user]);

      const response = await httpClient.updateDiscussionStatus({
        headers: { authorization: existingToken },
        urlParams: {
          discussionId: discussion.id,
        },
        body: {
          status: "REJECTED",
          rejectionKind: "OTHER",
          rejectionReason: "No reason",
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
      const user = new InclusionConnectedUserBuilder().build();
      const discussion = new DiscussionBuilder().build();
      const existingToken = generateInclusionConnectJwt({
        userId: user.id,
        version: currentJwtVersions.inclusion,
      });
      inMemoryUow.discussionRepository.discussions = [discussion];
      inMemoryUow.userRepository.setInclusionConnectedUsers([user]);

      const response = await httpClient.updateDiscussionStatus({
        headers: { authorization: existingToken },
        urlParams: {
          discussionId: discussion.id,
        },
        body: {
          status: "REJECTED",
          rejectionKind: "OTHER",
          rejectionReason: "No reason",
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
      const user = new InclusionConnectedUserBuilder().build();
      const discussion = new DiscussionBuilder()
        .withEstablishmentContact({
          email: user.email,
        })
        .build();
      const existingToken = generateInclusionConnectJwt({
        userId: user.id,
        version: currentJwtVersions.inclusion,
      });
      inMemoryUow.discussionRepository.discussions = [discussion];
      inMemoryUow.userRepository.setInclusionConnectedUsers([user]);

      const response = await httpClient.updateDiscussionStatus({
        headers: { authorization: existingToken },
        urlParams: {
          discussionId: discussion.id,
        },
        body: {
          status: "REJECTED",
          rejectionKind: "OTHER",
          rejectionReason: "No reason",
        },
      });
      expectHttpResponseToEqual(response, {
        status: 200,
        body: "",
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
        body: { message: "Provided token is invalid", status: 401 },
      });
    });

    it("save the event to Broadcast Convention again, than it event triggers calling partners", async () => {
      const adminUser = new InclusionConnectedUserBuilder()
        .withIsAdmin(true)
        .build();

      inMemoryUow.userRepository.setInclusionConnectedUsers([adminUser]);

      const token = generateInclusionConnectJwt({
        userId: adminUser.id,
        version: currentJwtVersions.inclusion,
      });

      const convention = new ConventionDtoBuilder().build();
      inMemoryUow.conventionRepository.setConventions([convention]);

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
});
