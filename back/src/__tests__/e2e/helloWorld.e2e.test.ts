import supertest, { SuperTest, Test } from "supertest";
import { createApp } from "../../adapters/primary/server";
import { FeatureFlagsBuilder } from "../../_testBuilders/FeatureFlagsBuilder";

describe("Hello world route", () => {
  let request: SuperTest<Test>;

  beforeEach(() => {
    request = supertest(
      createApp({
        featureFlags: new FeatureFlagsBuilder().build(),
      }),
    );
  });

  it("says hello", async () => {
    const response = await request.get("/");
    expect(response.body).toEqual({ message: "Hello World !" });
  });
});
