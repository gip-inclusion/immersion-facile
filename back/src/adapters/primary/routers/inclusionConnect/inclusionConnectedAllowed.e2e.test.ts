import { inclusionConnectedAllowedTargets } from "shared";
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
    const { request, generateAuthenticatedUserToken } = await buildTestApp();
    const userId = "123";
    const token = generateAuthenticatedUserToken({ userId }, 0);

    const response = await request
      .get(inclusionConnectedAllowedTargets.getAgencyDashboard.url)
      .set("Authorization", token);

    expect(response.body).toEqual({ error: "jwt expired" });
    expect(response.status).toBe(403);
  });

  it("sets the payload in the request, and returns 200 when things are good !", async () => {
    const { request, generateAuthenticatedUserToken } = await buildTestApp();
    const userId = "123";
    const token = generateAuthenticatedUserToken({ userId });

    const response = await request
      .get(inclusionConnectedAllowedTargets.getAgencyDashboard.url)
      .set("Authorization", token);

    expect(response.body).toEqual({
      success: "All good, userId is 123. TODO, get dashboard",
    });
    expect(response.status).toBe(200);
  });
});
