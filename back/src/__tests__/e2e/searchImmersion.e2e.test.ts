import supertest, { SuperTest, Test } from "supertest";
import { createApp } from "../../adapters/primary/server";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";

describe("/search-immersion route", () => {
  let request: SuperTest<Test>;

  beforeEach(async () => {
    request = supertest(await createApp(new AppConfigBuilder().build()));
  });

  test("accepts valid requests", async () => {
    await request
      .post(`/search-immersion`)
      .send({
        rome: "A1000",
        location: {
          lat: 48.8531,
          lon: 2.34999,
        },
        distance_km: 30,
      })
      .expect(200, []);
  });

  // TODO add test which actually recovers data (and one with token, one without)

  test("rejects invalid requests with error code 400", async () => {
    await request
      .post(`/search-immersion`)
      .send({
        rome: "XXXXX", // not a valid rome code
        location: {
          lat: 48.8531,
          lon: 2.34999,
        },
        distance_km: 30,
      })
      .expect(400, /Code ROME incorrect/);
  });
});
