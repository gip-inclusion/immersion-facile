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
      .end((err, res) => {
        if (err) return done(err);
        supertest(app)
          .post("/formulaires")
          .send(validFormulaire)
          .expect(200)
          .expect("Content-Type", /json/)
          .end((err, res) => {
            if (err) return done(err);
            expect(typeof res.body.id).toEqual("string");
            expect(res.body.id).not.toEqual("");

            // GET /formulaires returns the recorded formulaire.
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
