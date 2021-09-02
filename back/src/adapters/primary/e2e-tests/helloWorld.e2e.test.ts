import supertest from "supertest";
import { app } from "src/adapters/primary/server";

const request = supertest(app);

describe("Hello world route", () => {
  it("says hello", async () => {
    const response = await request.get("/");
    expect(response.body).toEqual({ message: "Hello World !" });
  });
});
