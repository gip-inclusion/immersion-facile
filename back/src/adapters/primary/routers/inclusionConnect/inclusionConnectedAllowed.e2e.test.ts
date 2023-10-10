import { SuperTest, Test } from "supertest";
import {
  AgencyDtoBuilder,
  currentJwtVersions,
  displayRouteName,
  expectHttpResponseToEqual,
  expectToEqual,
  InclusionConnectedAllowedRoutes,
  inclusionConnectedAllowedRoutes,
} from "shared";
import { InclusionConnectedUser } from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { GenerateInclusionConnectJwt } from "../../../../domain/auth/jwt";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe("InclusionConnectedAllowedRoutes", () => {
  const userId = "123";
  const agency = new AgencyDtoBuilder().build();
  const inclusionConnectedUserWithoutRights: InclusionConnectedUser = {
    id: userId,
    email: "joe@mail.com",
    firstName: "Joe",
    lastName: "Doe",
    agencyRights: [],
  };
  const inclusionConnectedUserWithRights: InclusionConnectedUser = {
    ...inclusionConnectedUserWithoutRights,
    agencyRights: [{ agency, role: "validator" }],
  };

  let httpClient: HttpClient<InclusionConnectedAllowedRoutes>;
  let generateInclusionConnectJwt: GenerateInclusionConnectJwt;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    let request: SuperTest<Test>;
    ({ request, generateInclusionConnectJwt, inMemoryUow } =
      await buildTestApp());
    httpClient = createSupertestSharedClient(
      inclusionConnectedAllowedRoutes,
      request,
    );
  });

  describe("/inclusion-connected/user", () => {
    it(`${displayRouteName(
      inclusionConnectedAllowedRoutes.getInclusionConnectedUser,
    )} 200 with dashboard url on response body`, async () => {
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
          dashboardUrl: `http://stubAgencyDashboard/${agency.id}`,
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

      expect(response.body).toEqual({ error: "jwt malformed" });
      expect(response.status).toBe(403);
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

      expect(response.body).toEqual({ error: "jwt expired" });
      expect(response.status).toBe(403);
    });
  });

  describe(`/inclusion-connected/register-agency`, () => {
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
          agencyRights: [{ agency, role: "toReview" }],
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
});
