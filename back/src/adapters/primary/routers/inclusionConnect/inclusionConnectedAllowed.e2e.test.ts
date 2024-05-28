import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  DiscussionBuilder,
  InclusionConnectedAllowedRoutes,
  InclusionConnectedUser,
  User,
  currentJwtVersions,
  displayRouteName,
  expectHttpResponseToEqual,
  expectToEqual,
  inclusionConnectedAllowedRoutes,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { SuperTest, Test } from "supertest";
import { Gateways } from "../../../../config/bootstrap/createGateways";
import { GenerateInclusionConnectJwt } from "../../../../domains/core/jwt";
import { broadcastToPeServiceName } from "../../../../domains/core/saved-errors/ports/SavedErrorRepository";
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

  beforeEach(async () => {
    let request: SuperTest<Test>;
    ({ request, generateInclusionConnectJwt, inMemoryUow, gateways } =
      await buildTestApp());
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

      inMemoryUow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
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
    )} 403 with bad token`, async () => {
      const response = await httpClient.getInclusionConnectedUser({
        headers: { authorization: "wrong-token" },
      });

      expectHttpResponseToEqual(response, {
        body: { error: "jwt malformed" },
        status: 403,
      });
    });

    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.getInclusionConnectedUser,
    )} 403 with expired token`, async () => {
      const userId = "123";
      const token = generateInclusionConnectJwt(
        { userId, version: currentJwtVersions.inclusion },
        0,
      );

      const response = await httpClient.getInclusionConnectedUser({
        headers: { authorization: token },
      });

      expectHttpResponseToEqual(response, {
        body: { error: "jwt expired" },
        status: 403,
      });
    });
  });

  describe("/inclusion-connected/register-agency", () => {
    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.registerAgenciesToUser,
    )} 200 add an agency as registered to an Inclusion Connected user`, async () => {
      inMemoryUow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
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
      expectToEqual(
        await inMemoryUow.inclusionConnectedUserRepository.getById(userId),
        {
          ...inclusionConnectedUserWithRights,
          agencyRights: [
            { agency, roles: ["toReview"], isNotifiedByEmail: false },
          ],
        },
      );
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
    )} 403 with bad token`, async () => {
      const response = await httpClient.markPartnersErroredConventionAsHandled({
        headers: { authorization: "wrong-token" },
        body: { conventionId: "11111111-1111-4111-1111-111111111111" },
      });
      expectHttpResponseToEqual(response, {
        body: { error: "jwt malformed" },
        status: 403,
      });
    });

    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.markPartnersErroredConventionAsHandled,
    )} 403 with expired token`, async () => {
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
        body: { error: "jwt expired" },
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
      inMemoryUow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
        user,
      ]);
      inMemoryUow.agencyRepository.setAgencies([agency]);
      inMemoryUow.conventionRepository.setConventions([convention]);
      await inMemoryUow.errorRepository.save({
        serviceName: broadcastToPeServiceName,
        consumerName: "France Travail",
        consumerId: null,
        subscriberErrorFeedback: { message: "Some message" },
        params: { conventionId, httpStatus: 500 },
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
      expectToEqual(inMemoryUow.errorRepository.savedErrors, [
        {
          serviceName: broadcastToPeServiceName,
          consumerName: "France Travail",
          consumerId: null,
          subscriberErrorFeedback: {
            message: "Some message",
          },
          params: { conventionId, httpStatus: 500 },
          occurredAt: new Date("2023-10-26T12:00:00.000"),
          handledByAgency: true,
        },
      ]);
    });

    describe(`${displayRouteName(
      inclusionConnectedAllowedRoutes.getInclusionConnectLogoutUrl,
    )} returns the logout url`, () => {
      it("returns a correct logout url with status 200", async () => {
        const response = await httpClient.getInclusionConnectLogoutUrl();
        expectHttpResponseToEqual(response, {
          body: "https://fake-inclusion.com/logout/?client_id=inclusion-client-id&post_logout_redirect_uri=https://my-domain",
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
});
