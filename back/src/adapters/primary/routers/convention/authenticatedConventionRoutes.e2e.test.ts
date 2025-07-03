import {
  AgencyDtoBuilder,
  type AuthenticatedConventionRoutes,
  authExpiredMessage,
  authenticatedConventionRoutes,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  currentJwtVersions,
  defaultProConnectInfos,
  displayRouteName,
  errors,
  expectArraysToMatch,
  expectHttpResponseToEqual,
  expectToEqual,
  type User,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import type { SuperTest, Test } from "supertest";
import { invalidTokenMessage } from "../../../../config/bootstrap/connectedUserAuthMiddleware";
import type { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import type { GenerateConnectedUserJwt } from "../../../../domains/core/jwt";
import { broadcastToFtLegacyServiceName } from "../../../../domains/core/saved-errors/ports/BroadcastFeedbacksRepository";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { toAgencyWithRights } from "../../../../utils/agency";
import { buildTestApp } from "../../../../utils/buildTestApp";

describe("authenticatedConventionRoutes", () => {
  const agency = new AgencyDtoBuilder().withKind("pole-emploi").build();

  let httpClient: HttpClient<AuthenticatedConventionRoutes>;
  let generateConnectedUserJwt: GenerateConnectedUserJwt;
  let inMemoryUow: InMemoryUnitOfWork;
  let eventCrawler: BasicEventCrawler;

  beforeEach(async () => {
    let request: SuperTest<Test>;
    ({ request, generateConnectedUserJwt, inMemoryUow, eventCrawler } =
      await buildTestApp());
    httpClient = createSupertestSharedClient(
      authenticatedConventionRoutes,
      request,
    );
  });

  describe("Mark partners errored convention as handled", () => {
    it(`${displayRouteName(
      authenticatedConventionRoutes.markPartnersErroredConventionAsHandled,
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
      authenticatedConventionRoutes.markPartnersErroredConventionAsHandled,
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
      authenticatedConventionRoutes.markPartnersErroredConventionAsHandled,
    )} 401 with expired token`, async () => {
      const userId = "123";
      const token = generateConnectedUserJwt(
        { userId, version: currentJwtVersions.connectedUser },
        0,
      );
      const response = await httpClient.markPartnersErroredConventionAsHandled({
        headers: { authorization: token },
        body: { conventionId: "11111111-1111-4111-1111-111111111111" },
      });
      expectHttpResponseToEqual(response, {
        body: { message: authExpiredMessage, status: 401 },
        status: 401,
      });
    });

    it(`${displayRouteName(
      authenticatedConventionRoutes.markPartnersErroredConventionAsHandled,
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
        version: currentJwtVersions.connectedUser,
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
        version: currentJwtVersions.connectedUser,
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
  });

  describe(`${displayRouteName(
    authenticatedConventionRoutes.broadcastConventionAgain,
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
      const adminUser = new ConnectedUserBuilder()
        .withIsAdmin(true)
        .buildUser();
      const validator = new ConnectedUserBuilder()
        .withId("validator")
        .withEmail("validator@mail.com")
        .buildUser();

      inMemoryUow.userRepository.users = [adminUser, validator];

      const token = generateConnectedUserJwt({
        userId: adminUser.id,
        version: currentJwtVersions.connectedUser,
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
});
