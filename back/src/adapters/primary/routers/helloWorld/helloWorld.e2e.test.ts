import { SuperTest, Test } from "supertest";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";

describe("Hello world route", () => {
  let request: SuperTest<Test>;

  beforeEach(async () => {
    ({ request } = await buildTestApp());
  });

  it("says hello", async () => {
    const response = await request.get("/");
    expect(response.body).toEqual({ message: "Hello World !" });
  });
});
