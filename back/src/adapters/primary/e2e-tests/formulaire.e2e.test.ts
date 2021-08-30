import supertest from "supertest";
import { app } from "../server";
import { validFormulaire } from "../../../domain/formulaires/entities/FormulaireEntityTestData";
import { FormulaireEntity } from "../../../domain/formulaires/entities/FormulaireEntity";

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
      .auth("e2e_tests", "e2e")
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
                expect(res.body).toEqual(validFormulaire);
                done();
              });
          });
      });
  });

  it("updates an existing formulaire and returns it", (done) => {
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

        // POSTing an updated formulaire to the same id succeeds.
        const formulaireId = res.body.id;
        const updatedFormulaire = {
          ...validFormulaire,
          email: "new@email.fr",
        };
        supertest(app)
          .post(`/formulaires/${formulaireId}`)
          .send(updatedFormulaire)
          .expect(200)
          .expect("Content-Type", /json/)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.id).toEqual(formulaireId);

            // GETting the updated formulaire succeeds.
            supertest(app)
              .get(`/formulaires/${formulaireId}`)
              .expect(200)
              .expect("Content-Type", /json/)
              .end((err, res) => {
                if (err) return done(err);
                expect(res.body).toEqual(updatedFormulaire);
                done();
              });
          });
      });
  });

  it("fetching unknown formulaire IDs reports 404 Not Found", (done) => {
    supertest(app).get("/formulaires/unknown-formulaire-id").expect(404, done);
  });

  it("posting to unknown formulaire IDs reports 404 Not Found", (done) => {
    supertest(app)
      .post("/formulaires/unknown-formulaire-id")
      .send(validFormulaire)
      .expect(404, done);
  });

  it("Fails to fetch formulaires without credentials", (done) => {
    supertest(app).get("/formulaires").expect(401, done);
  });

  it("Fails to fetch formulaires with invalid credentials", (done) => {
    supertest(app)
      .get("/formulaires")
      .auth("not real user", "not real password")
      .expect(401, done);
  });

  it("Fetches formulaires with valid credentials", (done) => {
    // GET /formulaires succeeds with login/pass.
    supertest(app)
      .get("/formulaires")
      .auth("e2e_tests", "e2e")
      .expect("Content-Type", /json/)
      .expect(200, done);
  });
});
