import { adminLogin } from "shared";
import { SuperTest, Test } from "supertest";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";

describe("admin login", () => {
  let request: SuperTest<Test>;

  beforeEach(async () => {
    const appConfig = new AppConfigBuilder()
      .withConfigParams({
        ADMIN_JWT_SECRET: "my-secret",
        BACKOFFICE_USERNAME: "user",
        BACKOFFICE_PASSWORD: "password",
      })
      .build();

    ({ request } = await buildTestApp(appConfig));
  });

  it("refuses to connect with wrong credentials", async () => {
    const response = await request.post(`/admin/${adminLogin}`).send({
      user: "lala",
      password: "lulu",
    });
    expect(response.body).toEqual({
      errors: "Wrong credentials",
    });
    expect(response.status).toBe(403);
  });

  it("returns token if credentials are correct", async () => {
    const response = await request.post(`/admin/${adminLogin}`).send({
      user: "user",
      password: "password",
    });
    // eslint-disable-next-line no-console
    console.log("flaky ? response body : ", JSON.stringify(response.body));
    expect(typeof response.body).toBe("string");
    expect(response.status).toBe(200);
  });
});
