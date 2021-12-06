import supertest, { SuperTest, Test } from "supertest";
import { createApp } from "../../adapters/primary/server";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";

describe("/contact-establishment route", () => {
  let request: SuperTest<Test>;

  beforeEach(async () => {
    request = supertest(await createApp(new AppConfigBuilder().build()));
  });

  test("fails for invalid requests", async () => {
    await request
      .post(`/contact-establishment`)
      .send({ not_a: "valid_request" })
      .expect(400);
  });
});
