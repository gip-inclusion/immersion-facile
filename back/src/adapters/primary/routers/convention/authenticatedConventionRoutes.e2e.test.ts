import {
  AgencyDtoBuilder,
  type AuthenticatedConventionRoutes,
  authExpiredMessage,
  authenticatedConventionRoutes,
  ConnectedUserBuilder,
  type ConnectedUserJwt,
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
import {
  buildTestApp,
  type InMemoryGateways,
} from "../../../../utils/buildTestApp";

describe("authenticatedConventionRoutes", () => {
  const agency = new AgencyDtoBuilder().withKind("pole-emploi").build();
  const validator = new ConnectedUserBuilder()
    .withId("validator")
    .withEmail("validator@mail.com")
    .buildUser();

  let httpClient: HttpClient<AuthenticatedConventionRoutes>;
  let generateConnectedUserJwt: GenerateConnectedUserJwt;
  let inMemoryUow: InMemoryUnitOfWork;
  let eventCrawler: BasicEventCrawler;
  let gateways: InMemoryGateways;
  let validToken: ConnectedUserJwt;

  beforeEach(async () => {
    let request: SuperTest<Test>;
    ({
      request,
      generateConnectedUserJwt,
      inMemoryUow,
      eventCrawler,
      gateways,
    } = await buildTestApp());

    httpClient = createSupertestSharedClient(
      authenticatedConventionRoutes,
      request,
    );

    inMemoryUow.userRepository.users = [validator];

    validToken = generateConnectedUserJwt({
      userId: validator.id,
      version: currentJwtVersions.connectedUser,
    });
  });

  describe("Mark partners errored convention as handled", () => {
    it(`${displayRouteName(
      authenticatedConventionRoutes.markPartnersErroredConventionAsHandled,
    )} 400 without headers`, async () => {
      const response = await httpClient.markPartnersErroredConventionAsHandled({
        headers: {} as any,
        body: { conventionId: "11111111-1111-4111-9111-111111111111" },
      });
      expectHttpResponseToEqual(response, {
        body: {
          issues: [
            "authorization : Invalid input: expected string, received undefined",
          ],
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
        body: { conventionId: "11111111-1111-4111-9111-111111111111" },
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
        body: { conventionId: "11111111-1111-4111-9111-111111111111" },
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
      const conventionId = "11111111-1111-4111-9111-111111111111";
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
        body: { conventionId },
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
      const conventionId = "11111111-1111-4111-9111-111111111111";
      const agency = new AgencyDtoBuilder().build();
      const convention = new ConventionDtoBuilder()
        .withId(conventionId)
        .withAgencyId(agency.id)
        .build();
      inMemoryUow.userRepository.users = [validator];
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
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
        occurredAt: "2023-10-26T12:00:00.000Z",
        handledByAgency: false,
      });

      const response = await httpClient.markPartnersErroredConventionAsHandled({
        headers: { authorization: validToken },
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
            occurredAt: "2023-10-26T12:00:00.000Z",
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
        body: { conventionId: "11111111-1111-4111-9111-111111111111" },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: { message: invalidTokenMessage, status: 401 },
      });
    });

    it("save the event to Broadcast Convention again, than it event triggers calling partners", async () => {
      const convention = new ConventionDtoBuilder().build();
      inMemoryUow.conventionRepository.setConventions([convention]);
      inMemoryUow.agencyRepository.insert(
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      );

      const response = await httpClient.broadcastConventionAgain({
        headers: { authorization: validToken },
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

  describe("GetConventionsForAgencyUser", () => {
    const peAgency = new AgencyDtoBuilder().withKind("pole-emploi").build();

    const convention1 = new ConventionDtoBuilder()
      .withId("aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaaa")
      .withAgencyId(peAgency.id)
      .withDateStart(new Date("2023-03-15").toISOString())
      .withDateEnd(new Date("2023-03-20").toISOString())
      .withDateSubmission(new Date("2023-03-10").toISOString())
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .build();

    const convention2 = new ConventionDtoBuilder()
      .withId("bbbbbc99-9c0b-1bbb-bb6d-6bb9bd38bbbb")
      .withAgencyId(peAgency.id)
      .withDateStart(new Date("2023-02-15").toISOString())
      .withDateEnd(new Date("2023-02-20").toISOString())
      .withDateSubmission(new Date("2023-02-10").toISOString())
      .withStatus("PARTIALLY_SIGNED")
      .build();

    beforeEach(async () => {
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(peAgency, {
          [validator.id]: { roles: ["validator"], isNotifiedByEmail: false },
        }),
      ];
      inMemoryUow.conventionRepository.setConventions([
        convention1,
        convention2,
      ]);
      inMemoryUow.assessmentRepository.assessments = [
        {
          conventionId: convention1.id,
          status: "COMPLETED",
          endedWithAJob: false,
          establishmentFeedback: "Ca c'est bien passé",
          establishmentAdvices: "mon conseil",
          numberOfHoursActuallyMade: 35,
          _entityName: "Assessment",
        },
      ];
    });

    it("401 - Unauthorized when not correctly authenticated", async () => {
      const response = await httpClient.getConventionsForAgencyUser({
        headers: { authorization: "invalid-token" },
        queryParams: {},
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: {
          status: 401,
          message: "Provided token is invalid",
        },
      });
    });

    it("200 - Successfully gets conventions with date filter", async () => {
      gateways.timeGateway.setNextDate(new Date());
      const jwt = generateConnectedUserJwt({
        userId: validator.id,
        version: currentJwtVersions.connectedUser,
        iat: Math.round(gateways.timeGateway.now().getTime() / 1000),
      });

      const response = await httpClient.getConventionsForAgencyUser({
        headers: { authorization: jwt },
        queryParams: {
          dateStartFrom: "2023-01-01",
          statuses: ["ACCEPTED_BY_VALIDATOR", "PARTIALLY_SIGNED"],
          sortBy: "dateStart",
          page: 1,
          perPage: 10,
        },
      });

      const agencyFields = {
        agencyName: peAgency.name,
        agencyDepartment: peAgency.address.departmentCode,
        agencyKind: peAgency.kind,
        agencySiret: peAgency.agencySiret,
        agencyCounsellorEmails: [],
        agencyValidatorEmails: [validator.email],
        agencyRefersTo: undefined,
      };

      const conventionRead1 = {
        ...convention1,
        ...agencyFields,
        assessment: {
          status: "COMPLETED" as const,
          endedWithAJob: false,
        },
      };

      const conventionRead2 = {
        ...convention2,
        ...agencyFields,
        assessment: null,
      };

      expectHttpResponseToEqual(response, {
        status: 200,
        body: {
          data: [conventionRead1, conventionRead2],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 10,
            totalRecords: 2,
          },
        },
      });

      expectToEqual(inMemoryUow.conventionQueries.paginatedConventionsParams, [
        {
          agencyUserId: validator.id,
          filters: {
            dateStart: { from: "2023-01-01" },
            statuses: ["ACCEPTED_BY_VALIDATOR", "PARTIALLY_SIGNED"],
          },
          pagination: {
            page: 1,
            perPage: 10,
          },
          sort: {
            by: "dateStart",
            direction: "desc",
          },
        },
      ]);
    });

    it("200 - Successfully gets conventions with assessment completion status filter - completed", async () => {
      gateways.timeGateway.setNextDate(new Date());
      const jwt = generateConnectedUserJwt({
        userId: validator.id,
        version: currentJwtVersions.connectedUser,
        iat: Math.round(gateways.timeGateway.now().getTime() / 1000),
      });

      const response = await httpClient.getConventionsForAgencyUser({
        headers: { authorization: jwt },
        queryParams: {
          assessmentCompletionStatus: "completed",
          sortBy: "dateStart",
          page: 1,
          perPage: 10,
        },
      });

      const agencyFields = {
        agencyName: peAgency.name,
        agencyDepartment: peAgency.address.departmentCode,
        agencyKind: peAgency.kind,
        agencySiret: peAgency.agencySiret,
        agencyCounsellorEmails: [],
        agencyValidatorEmails: [validator.email],
        agencyRefersTo: undefined,
      };

      const conventionRead1 = {
        ...convention1,
        ...agencyFields,
        assessment: {
          status: "COMPLETED" as const,
          endedWithAJob: false,
        },
      };

      expectHttpResponseToEqual(response, {
        status: 200,
        body: {
          data: [conventionRead1],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 10,
            totalRecords: 1,
          },
        },
      });

      expectToEqual(inMemoryUow.conventionQueries.paginatedConventionsParams, [
        {
          agencyUserId: validator.id,
          filters: {
            assessmentCompletionStatus: "completed",
          },
          pagination: {
            page: 1,
            perPage: 10,
          },
          sort: {
            by: "dateStart",
            direction: "desc",
          },
        },
      ]);
    });

    it("200 - Successfully gets conventions with assessment completion status filter - to-be-completed", async () => {
      gateways.timeGateway.setNextDate(new Date());
      const jwt = generateConnectedUserJwt({
        userId: validator.id,
        version: currentJwtVersions.connectedUser,
        iat: Math.round(gateways.timeGateway.now().getTime() / 1000),
      });

      const response = await httpClient.getConventionsForAgencyUser({
        headers: { authorization: jwt },
        queryParams: {
          assessmentCompletionStatus: "to-be-completed",
          sortBy: "dateStart",
          page: 1,
          perPage: 10,
        },
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: {
          data: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            numberPerPage: 10,
            totalRecords: 0,
          },
        },
      });

      expectToEqual(inMemoryUow.conventionQueries.paginatedConventionsParams, [
        {
          agencyUserId: validator.id,
          filters: {
            assessmentCompletionStatus: "to-be-completed",
          },
          pagination: {
            page: 1,
            perPage: 10,
          },
          sort: {
            by: "dateStart",
            direction: "desc",
          },
        },
      ]);
    });

    it("200 - Successfully gets conventions with agencyIds filter", async () => {
      gateways.timeGateway.setNextDate(new Date());
      const jwt = generateConnectedUserJwt({
        userId: validator.id,
        version: currentJwtVersions.connectedUser,
        iat: Math.round(gateways.timeGateway.now().getTime() / 1000),
      });

      const response = await httpClient.getConventionsForAgencyUser({
        headers: { authorization: jwt },
        queryParams: {
          agencyIds: [peAgency.id],
          sortBy: "dateStart",
          page: 1,
          perPage: 10,
        },
      });

      const agencyFields = {
        agencyName: peAgency.name,
        agencyDepartment: peAgency.address.departmentCode,
        agencyKind: peAgency.kind,
        agencySiret: peAgency.agencySiret,
        agencyCounsellorEmails: [],
        agencyValidatorEmails: [validator.email],
        agencyRefersTo: undefined,
      };

      const conventionRead1 = {
        ...convention1,
        ...agencyFields,
        assessment: {
          status: "COMPLETED" as const,
          endedWithAJob: false,
        },
      };

      const conventionRead2 = {
        ...convention2,
        ...agencyFields,
        assessment: null,
      };

      expectHttpResponseToEqual(response, {
        status: 200,
        body: {
          data: [conventionRead1, conventionRead2],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 10,
            totalRecords: 2,
          },
        },
      });

      expectToEqual(inMemoryUow.conventionQueries.paginatedConventionsParams, [
        {
          agencyUserId: validator.id,
          filters: {
            agencyIds: [peAgency.id],
          },
          pagination: {
            page: 1,
            perPage: 10,
          },
          sort: {
            by: "dateStart",
            direction: "desc",
          },
        },
      ]);
    });
  });

  describe("getConventionsWithErroredBroadcastFeedbackForAgencyUser", () => {
    it("200 - Successfully gets empty array oferrored conventions for agency user", async () => {
      const response =
        await httpClient.getConventionsWithErroredBroadcastFeedbackForAgencyUser(
          {
            headers: { authorization: validToken },
            queryParams: {
              page: 1,
              perPage: 10,
            },
          },
        );
      expectHttpResponseToEqual(response, {
        status: 200,
        body: {
          data: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            numberPerPage: 10,
            totalRecords: 0,
          },
        },
      });
    });

    it("400 - Bad request when missing query params", async () => {
      const response =
        await httpClient.getConventionsWithErroredBroadcastFeedbackForAgencyUser(
          {
            headers: { authorization: validToken },
            queryParams: {} as any,
          },
        );

      expectHttpResponseToEqual(response, {
        status: 400,
        body: {
          issues: [
            "page : Invalid input: expected number, received NaN",
            "perPage : Invalid input: expected number, received NaN",
          ],
          message:
            "Shared-route schema 'queryParamsSchema' was not respected in adapter 'express'.\nRoute: GET /inclusion-connected/conventions-with-errored-broadcast-feedback",
          status: 400,
        },
      });
    });

    it("401 - Unauthorized with bad token", async () => {
      const response =
        await httpClient.getConventionsWithErroredBroadcastFeedbackForAgencyUser(
          {
            headers: { authorization: "wrong-token" },
            queryParams: {
              page: 1,
              perPage: 10,
            },
          },
        );
      expectHttpResponseToEqual(response, {
        status: 401,
        body: {
          status: 401,
          message: "Provided token is invalid",
        },
      });
    });

    it("401 - Unauthorized with expired token", async () => {
      const userId = "123";
      const token = generateConnectedUserJwt(
        { userId, version: currentJwtVersions.connectedUser },
        0,
      );
      const response =
        await httpClient.getConventionsWithErroredBroadcastFeedbackForAgencyUser(
          {
            headers: { authorization: token },
            queryParams: {
              page: 1,
              perPage: 10,
            },
          },
        );
      expectHttpResponseToEqual(response, {
        body: { message: authExpiredMessage, status: 401 },
        status: 401,
      });
    });
  });
});
