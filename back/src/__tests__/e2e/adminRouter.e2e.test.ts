import { AdminToken } from "shared/src/admin/admin.dto";
import { conventionsRoute } from "shared/src/routes";
import { SuperTest, Test } from "supertest";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";
import { buildTestApp } from "../../_testBuilders/buildTestApp";

describe("/admin router", () => {
  let request: SuperTest<Test>;
  let token: AdminToken;

  beforeEach(async () => {
    const appConfig = new AppConfigBuilder()
      .withConfigParams({
        ADMIN_JWT_SECRET: "a-secret",
        BACKOFFICE_USERNAME: "user",
        BACKOFFICE_PASSWORD: "pwd",
      })
      .build();

    ({ request } = await buildTestApp(appConfig));

    const response = await request
      .post("/admin/login")
      .send({ user: "user", password: "pwd" });

    token = response.body;
  });

  describe(`GET /admin/${conventionsRoute}`, () => {
    it("Fails with 401 Unauthorized without admin token", async () => {
      const response = await request.get(`/admin/${conventionsRoute}`);
      expect(response.body).toEqual({
        error: "You need to authenticate first",
      });
      expect(response.status).toBe(401);
    });

    it("Fails if token is not valid", async () => {
      const response = await request
        .get(`/admin/${conventionsRoute}`)
        .set("authorization", "wrong-tokend");
      expect(response.body).toEqual({ error: "Provided token is invalid" });
      expect(response.status).toBe(401);
    });

    it.skip("Lists the conventions if the token is valid", async () => {
      // test stays for demo purpose, but now .get(`/admin/${conventionsRoute}`) returns the iframe url from metabase
      const response = await request
        .get(`/admin/${conventionsRoute}`)
        .set("authorization", token);
      expect(response.body).toEqual([]);
      expect(response.status).toBe(200);
    });
  });
});
