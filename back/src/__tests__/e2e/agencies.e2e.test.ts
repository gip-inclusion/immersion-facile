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
        id: "a025666a-22d7-4752-86eb-d07e27a5766a",
        name: "AMIE du Boulonnais",
      },
      {
        id: "b0d734df-3047-4e42-aaca-9d86b9e1c81d",
        name: "Mission Locale Jeunes du Grand Narbonne",
      },
      {
        id: "c0fddfd9-8fdd-4e1e-8b99-ed5d733d3b83",
        name: "Site Soleil - Mission Locale de Paris",
      },
    ]);
  });
});
