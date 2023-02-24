import { AgencyDtoBuilder, inclusionConnectedAllowedTargets } from "shared";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";

describe("Router for users authenticated with Inclusion Connect", () => {
  it("throws unauthorized if no token provided", async () => {
    const { request } = await buildTestApp();
    const response = await request.get(
      inclusionConnectedAllowedTargets.getAgencyDashboard.url,
    );
    expect(response.body).toEqual({ error: "You need to authenticate first" });
    expect(response.status).toBe(401);
  });

  it("throws forbidden if no wrong token provided", async () => {
    const { request } = await buildTestApp();
    const response = await request
      .get(inclusionConnectedAllowedTargets.getAgencyDashboard.url)
      .set("Authorization", "wrong-token");
    expect(response.body).toEqual({ error: "jwt malformed" });
    expect(response.status).toBe(403);
  });

  it("throws forbidden if token is expired", async () => {
    const { request, generateAuthenticatedUserJwt } = await buildTestApp();
    const userId = "123";
    const token = generateAuthenticatedUserJwt({ userId }, 0);

    const response = await request
      .get(inclusionConnectedAllowedTargets.getAgencyDashboard.url)
      .set("Authorization", token);

    expect(response.body).toEqual({ error: "jwt expired" });
    expect(response.status).toBe(403);
  });

  it("Right path : HTTP 200 with dashboard url on response body", async () => {
    const { request, generateAuthenticatedUserJwt, inMemoryUow } =
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
    const token = generateAuthenticatedUserJwt({ userId });

    const response = await request
      .get(inclusionConnectedAllowedTargets.getAgencyDashboard.url)
      .set("Authorization", token);

    expect(response.body).toBe(`http://stubAgencyDashboard/${agency.id}`);
    expect(response.status).toBe(200);
  });
});
