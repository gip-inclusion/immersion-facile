import { SuperTest, Test } from "supertest";
import { expectToEqual } from "shared";
import { buildTestApp } from "../../../../utils/buildTestApp";

describe("/", () => {
  let request: SuperTest<Test>;

  beforeEach(async () => {
    ({ request } = await buildTestApp());
  });

  it("provide API doc URL", async () => {
    const response = await request.get("/");
    expect(response.body).toEqual({
      message:
        "Api documentation is here : https://immersion-facile.beta.gouv.fr/doc-api",
    });
  });

  describe("404 on unknown route", () => {
    it.each([
      "/unknown",
      "/unknown/unknown?jwt=unknown",
      "/v1/unknown",
      "/v2/unknown",
      "/auth/unknown",
      "/auth/unknown ",
      "/auth/demandes-immersion/unknown/unknown",
    ])("on %s", async (url) => {
      const response = await request.get(url);
      expect(response.status).toBe(404);
      expectToEqual(response.body, {});
    });
  });
});
