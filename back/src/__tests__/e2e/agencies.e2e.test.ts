import supertest, { SuperTest, Test } from "supertest";
import { createApp } from "../../adapters/primary/server";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";

describe("/agencies route", () => {
  let request: SuperTest<Test>;

  beforeEach(async () => {
    const { app } = await createApp(new AppConfigBuilder().build());
    request = supertest(app);
  });

  it("returns agency list", async () => {
    await request.get(`/agencies?lat=10.123&lon=10.123`).expect(200, [
      {
        id: "test-agency-1-back",
        name: "Test Agency 1 (back)",
        position: {
          lat: 1,
          lon: 2,
        },
      },
      {
        id: "test-agency-2-back",
        name: "Test Agency 2 (back)",
        position: {
          lat: 40,
          lon: 50,
        },
      },
      {
        id: "test-agency-3-back",
        name: "Test Agency 3 (back)",
        position: {
          lat: 88,
          lon: 89.9999,
        },
      },
      {
        id: "immersion-facile-agency",
        name: "Immersion Facile Agency (back)",
        position: { lat: 22.319469, lon: 114.189505 },
      },
    ]);
  });
});
