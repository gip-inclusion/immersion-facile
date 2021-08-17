import supertest from "supertest";
import { app } from "../server";
import { validFormulaire } from "../../../domain/formulaires/entities/FormulaireEntityTestData";

describe("/formulaires route", () => {
  it("rejects invalid requests", (done) => {
    supertest(app)
      .post("/formulaires")
      .send({ invalid_params: true })
      .expect(400, done);
  });

  it("records valid formulaires and returns them", (done) => {
    // GET /formulaires returns an empty list.
    supertest(app)
      .get("/formulaires")
      .expect("Content-Type", /json/)
      .expect(200, [])

      // POSTing a valid formulaire succeeds.
      .then(() => {
        supertest(app)
          .post("/formulaires")
          .send(validFormulaire)
          .expect("Content-Type", /json/)
          .expect(200, { success: true })

          // GET /formulaires returns the recorded formulaire.
          .then(() => {
            supertest(app)
              .get("/formulaires")
              .expect("Content-Type", /json/)
              .expect(function (res) {
                res.body[0].dateStart = new Date(res.body[0].dateStart);
                res.body[0].dateEnd = new Date(res.body[0].dateEnd);
              })
              .expect(200, [validFormulaire], done);
          });
      });
  });
});
