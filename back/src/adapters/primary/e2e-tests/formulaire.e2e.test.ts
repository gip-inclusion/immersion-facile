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

  it("records a valid formulaire and returns it", (done) => {
    // GET /formulaires returns an empty list.
    supertest(app)
      .get("/formulaires")
      .expect("Content-Type", /json/)
      .expect(200)

      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).toEqual([]);

        // POSTing a valid formulaire succeeds.
        supertest(app)
          .post("/formulaires")
          .send(validFormulaire)
          .expect(200)
          .expect("Content-Type", /json/)
          .end((err, res) => {
            if (err) return done(err);
            expect(typeof res.body.id).toEqual("string");
            expect(res.body.id).not.toEqual("");

            // GETting the new formulaire succeeds.
            supertest(app)
              .get(`/formulaires/${res.body.id}`)
              .expect(200)
              .expect("Content-Type", /json/)
              .end((err, res) => {
                if (err) return done(err);

                res.body.dateStart = new Date(res.body.dateStart);
                res.body.dateEnd = new Date(res.body.dateEnd);
                expect(res.body).toEqual(validFormulaire);

                done();
              });
          });
      });
  });

  it("reports 404 Not Found for unknown formulaire IDs", (done) => {
    supertest(app).get("/formulaires/unknown-formulaire-id").expect(404, done);
  });
});
