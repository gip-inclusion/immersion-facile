import supertest, { SuperTest, Test } from "supertest";
import { createApp } from "../../adapters/primary/server";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";

describe("Hello world route", () => {
  let request: SuperTest<Test>;

  beforeEach(() => {
    request = supertest(createApp(new AppConfigBuilder().build()));
  });

  it("says hello", async () => {
    const response = await request.get("/");
    expect(response.body).toEqual({ message: "Hello World !" });
  });
});
