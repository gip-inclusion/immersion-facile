import supertest, { SuperTest, Test } from "supertest";
import { createApp } from "../../adapters/primary/server";
import { FeatureFlagsBuilder } from "../../_testBuilders/FeatureFlagsBuilder";

describe("/rome route", () => {
  let request: SuperTest<Test>;

  beforeEach(() => {
    request = supertest(
      createApp({
        featureFlags: FeatureFlagsBuilder.allOff().build(),
      }),
    );
  });

  it("forwards valid requests", async () => {
    await request.get(`/rome?searchText=rails`).expect(200, [
      {
        romeCodeMetier: "N4301",
        description: "Conduite sur rails",
        matchRanges: [],
      },
    ]);
  });
});
