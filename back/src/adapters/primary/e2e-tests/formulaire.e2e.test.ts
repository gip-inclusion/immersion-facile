import supertest from "supertest";
import { app } from "../server";

describe("/formulaires route", () => {
  it("rejects invalid requests", (done) => {
    supertest(app)
      .post("/formulaires")
      .send({ invalid_params: true })
      .expect(400, done);
  });

  it("records valid formulaires and returns them", (done) => {
    const validParams = {
      email: "valid@email.fr",
      dateStart: new Date(1000).toISOString(),
      dateEnd: new Date(1001).toISOString(),
    };

    // GET /formulaires returns an empty list.
    supertest(app)
      .get("/formulaires")
      .expect("Content-Type", /json/)
      .expect(200, [])

      // POSTing a valid formulaire succeeds.
      .then(() => {
        supertest(app)
          .post("/formulaires")
          .send(validParams)
          .expect("Content-Type", /json/)
          .expect(200, { success: true })

          // GET /formulaires returns the recorded formulaire.
          .then(() => {
            supertest(app)
              .get("/formulaires")
              .expect("Content-Type", /json/)
              .expect(200, [validParams], done);
          });
      });
  });
});
