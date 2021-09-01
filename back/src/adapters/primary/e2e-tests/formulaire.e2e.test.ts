import supertest from "supertest";
import { validFormulaire } from "../../../domain/formulaires/entities/FormulaireEntityTestData";
import { app } from "../server";

// TODO: Find a way to clear the repository between tests so that we can reuse the same ID.

describe("/formulaires route", () => {
  it("rejects invalid requests", (done) => {
    supertest(app)
      .post("/formulaires")
      .send({ invalid_params: true })
      .expect(400, done);
  });

  it("records a valid formulaire and returns it", (done) => {
    const demandeImmersionId = "test_id_1";
    const demandeImmersion = {
      ...validFormulaire,
      id: demandeImmersionId
    };

    // GET /formulaires returns an empty list.
    supertest(app)
      .get("/formulaires")
      .auth("e2e_tests", "e2e")
      .expect("Content-Type", /json/)
      .expect(200)

      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).toEqual([]);

        // POSTing a valid demande d'immersion succeeds.
        supertest(app)
          .post("/formulaires")
          .send(demandeImmersion)
          .expect(200)
          .expect("Content-Type", /json/)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.id).toEqual(demandeImmersionId);

            // GETting the new demande d'immersion succeeds.
            supertest(app)
              .get(`/formulaires/${demandeImmersionId}`)
              .expect(200)
              .expect("Content-Type", /json/)
              .end((err, res) => {
                if (err) return done(err);
                expect(res.body).toEqual(demandeImmersion);
                done();
              });
          });
      });
  });

  it("updates an existing formulaire and returns it", (done) => {
    const demandeImmersionId = "test_id_2";
    const demandeImmersion = {
      ...validFormulaire,
      id: demandeImmersionId
    };

    // POSTing a valid demande d'immersion succeeds.
    supertest(app)
      .post("/formulaires")
      .send(demandeImmersion)
      .expect(200)
      .expect("Content-Type", /json/)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.id).toEqual(demandeImmersionId);

        // POSTing an updated demande d'immersion to the same id succeeds.
        const updatedDemandeImmersion = {
          ...demandeImmersion,
          email: "new@email.fr",
        };
        supertest(app)
          .post(`/formulaires/${demandeImmersionId}`)
          .send(updatedDemandeImmersion)
          .expect(200)
          .expect("Content-Type", /json/)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.id).toEqual(demandeImmersionId);

            // GETting the updated formulaire succeeds.
            supertest(app)
              .get(`/formulaires/${demandeImmersionId}`)
              .expect(200)
              .expect("Content-Type", /json/)
              .end((err, res) => {
                if (err) return done(err);
                expect(res.body).toEqual(updatedDemandeImmersion);
                done();
              });
          });
      });
  });

  it("fetching unknown formulaire IDs reports 404 Not Found", (done) => {
    supertest(app).get("/formulaires/unknown-formulaire-id").expect(404, done);
  });

  it("posting to unknown formulaire IDs reports 404 Not Found", (done) => {
    const demandeImmersionWithUnknownId = {
      ...validFormulaire,
      id: "unknown-formulaire-id",
    }
    supertest(app)
      .post("/formulaires/unknown-formulaire-id")
      .send(demandeImmersionWithUnknownId)
      .expect(404, done);
  });

  it("creating a demande d'immersion with an existing ID reports 409 Conflict", (done) => {
    const demandeImmersionId = "test_id_3";
    const demandeImmersion = {
      ...validFormulaire,
      id: demandeImmersionId
    };

    // POSTing a valid formulaire succeeds.
    supertest(app)
      .post("/formulaires")
      .send(demandeImmersion)
      .expect(200)
      .expect("Content-Type", /json/)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.id).toEqual(demandeImmersionId);

        const demandeImmersionWithExistingId = {
          ...demandeImmersion,
          email: "another@email.fr",
        }
        supertest(app)
          .post("/formulaires")
          .send(demandeImmersionWithExistingId)
          .expect(409, done);
      });
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
