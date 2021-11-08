import supertest, { SuperTest, Test } from "supertest";
import { createApp } from "../../adapters/primary/server";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";

describe("/agencies route", () => {
  let request: SuperTest<Test>;

  beforeEach(async () => {
    request = supertest(await createApp(new AppConfigBuilder().build()));
  });

  test("returns agency list", async () => {
    await request.get(`/agencies`).expect(200, [
      {
        id: "test-agency-1-back",
        name: "Test Agency 1 (back)",
      },
      {
        id: "test-agency-2-back",
        name: "Test Agency 2 (back)",
      },
      {
        id: "test-agency-3-back",
        name: "Test Agency 3 (back)",
      },
    ]);
  });
});
