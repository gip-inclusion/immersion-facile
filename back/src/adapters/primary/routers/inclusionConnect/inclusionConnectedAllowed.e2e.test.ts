import {
  AgencyDtoBuilder,
  currentJwtVersions,
  expectToEqual,
  inclusionConnectedAllowedTargets,
} from "shared";
import { InclusionConnectedUser } from "shared";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";

describe("Router for users authenticated with Inclusion Connect", () => {
  // <<<<----- Test to delete when getAgencyDashboard is obsolete
  it("Right path getAgencyDashboard : HTTP 200 with dashboard url on response body", async () => {
    const { request, generateInclusionConnectJwt, inMemoryUow } =
      await buildTestApp();
    const userId = "123";
    const agency = new AgencyDtoBuilder().build();
    inMemoryUow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      {
        id: userId,
        email: "joe@mail.com",
        firstName: "Joe",
        lastName: "Doe",
        agencyRights: [{ agency, role: "validator" }],
      },
    ]);
    const token = generateInclusionConnectJwt({
      userId,
      version: currentJwtVersions.inclusion,
    });

    const response = await request
      .get(inclusionConnectedAllowedTargets.getAgencyDashboard.url)
      .set("Authorization", token);

    expect(response.body).toBe(`http://stubAgencyDashboard/${agency.id}`);
    expect(response.status).toBe(200);
  });
  // end of test to delete when getAgencyDashboard is obsolete ----->>>>

  describe("GET getInclusionConnectedUser", () => {
    it("throws unauthorized if no token provided", async () => {
      const { request } = await buildTestApp();
      const response = await request.get(
        inclusionConnectedAllowedTargets.getInclusionConnectedUser.url,
      );
      expect(response.body).toEqual({
        error: "You need to authenticate first",
      });
      expect(response.status).toBe(401);
    });

    it("throws forbidden if no wrong token provided", async () => {
      const { request } = await buildTestApp();
      const response = await request
        .get(inclusionConnectedAllowedTargets.getInclusionConnectedUser.url)
        .set("Authorization", "wrong-token");
      expect(response.body).toEqual({ error: "jwt malformed" });
      expect(response.status).toBe(403);
    });

    it("throws forbidden if token is expired", async () => {
      const { request, generateInclusionConnectJwt } = await buildTestApp();
      const userId = "123";
      const token = generateInclusionConnectJwt(
        { userId, version: currentJwtVersions.inclusion },
        0,
      );

      const response = await request
        .get(inclusionConnectedAllowedTargets.getInclusionConnectedUser.url)
        .set("Authorization", token);

      expect(response.body).toEqual({ error: "jwt expired" });
      expect(response.status).toBe(403);
    });

    it("Right path getInclusionConnectedUser : HTTP 200 with dashboard url on response body", async () => {
      const { request, generateInclusionConnectJwt, inMemoryUow } =
        await buildTestApp();
      const userId = "123";
      const agency = new AgencyDtoBuilder().build();
      const inclusionConnectedUser: InclusionConnectedUser = {
        id: userId,
        email: "joe@mail.com",
        firstName: "Joe",
        lastName: "Doe",
        agencyRights: [{ agency, role: "validator" }],
      };
      inMemoryUow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
        inclusionConnectedUser,
      ]);
      const token = generateInclusionConnectJwt({
        userId,
        version: currentJwtVersions.inclusion,
      });

      const response = await request
        .get(inclusionConnectedAllowedTargets.getInclusionConnectedUser.url)
        .set("Authorization", token);

      expect(response.body).toEqual({
        ...inclusionConnectedUser,
        dashboardUrl: `http://stubAgencyDashboard/${agency.id}`,
      });
      expect(response.status).toBe(200);
    });
  });

  describe("RegisterAgencyToInclusionConnectUser use case", () => {
    it("throws without Inclusion Token", async () => {
      const { request } = await buildTestApp();
      const response = await request.post(
        inclusionConnectedAllowedTargets.registerAgenciesToUser.url,
      );
      expect(response.body).toEqual({
        error: "You need to authenticate first",
      });
      expect(response.status).toBe(401);
    });

    it("add an agency as registered to an Inclusion Connected user", async () => {
      const { request, inMemoryUow, generateInclusionConnectJwt } =
        await buildTestApp();
      const userId = "123456ab";
      const agency = new AgencyDtoBuilder().build();
      const user: InclusionConnectedUser = {
        id: userId,
        email: "joe@mail.com",
        firstName: "Joe",
        lastName: "Doe",
        agencyRights: [],
      };
      inMemoryUow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
        user,
      ]);
      inMemoryUow.agencyRepository.setAgencies([agency]);
      const token = generateInclusionConnectJwt({
        userId,
        version: currentJwtVersions.inclusion,
      });
      const response = await request
        .post(inclusionConnectedAllowedTargets.registerAgenciesToUser.url)
        .set("Authorization", token)
        .send([agency.id]);

      expect(response.body).toBe("");
      expect(response.status).toBe(200);
      expectToEqual(
        await inMemoryUow.inclusionConnectedUserRepository.getById(userId),
        { ...user, agencyRights: [{ agency, role: "toReview" }] },
      );
    });
  });
});
