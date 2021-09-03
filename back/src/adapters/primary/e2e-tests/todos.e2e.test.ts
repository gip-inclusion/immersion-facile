import supertest from "supertest";
import { app } from "../server";
import * as fs from "fs";

const request = supertest(app);

const emptyAppDataFile = () =>
  fs.writeFileSync(`${__dirname}/../../secondary/app-data.json`, "[]");

describe("Todos routes", () => {
  beforeAll(() => {
    emptyAppDataFile();
  });

  describe("When body is not valid", () => {
    it("fails when fields in the body are missing", async () => {
      const response = await request.post("/todos");
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: ["uuid is a required field", "description is a required field"],
      });
    });

    it("fails when description is to short", async () => {
      const response = await request
        .post("/todos")
        .send({ uuid: "uuidDescriptionToShort", description: "ie" });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        errors: ["Todo description should be at least 4 characters long"],
      });
    });
  });

  describe("When all is good", () => {
    it("adds a todo, then gets all the todos", async () => {
      const addTodoResponse = await request.post("/todos").send({
        uuid: "correctTodoUuid",
        description: "Description long enough",
      });
      expect(addTodoResponse.body).toEqual({ success: true });
      expect(addTodoResponse.status).toBe(200);

      const listTodoResponse = await request.get("/todos");
      expect(listTodoResponse.body).toEqual([
        {
          uuid: "correctTodoUuid",
          description: "Description long enough",
        },
      ]);
      expect(listTodoResponse.status).toBe(200);
    });
  });
});
