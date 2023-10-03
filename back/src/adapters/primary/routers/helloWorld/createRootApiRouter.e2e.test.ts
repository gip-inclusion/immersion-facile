import { SuperTest, Test } from "supertest";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";

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
});
