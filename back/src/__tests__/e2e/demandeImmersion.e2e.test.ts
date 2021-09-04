import supertest from "supertest";
import { demandesImmersionRoute } from "../../shared/routes";
import { DemandeImmersionDtoBuilder } from "../../_testBuilders/DemandeImmersionDtoBuilder";
import { app } from "../../adapters/primary/server";

// TODO: Find a way to clear the repository between tests so that we can reuse the same ID.

describe("/demandes-immersion route", () => {
  it("rejects invalid requests", (done) => {
    supertest(app)
      .post(`/${demandesImmersionRoute}`)
      .send({ invalid_params: true })
      .expect(400, done);
  });

  it("records a valid demandeImmersion and returns it", (done) => {
    const demandeImmersionId = "test_id_1";
    const demandeImmersion = new DemandeImmersionDtoBuilder()
      .withId(demandeImmersionId)
      .build();

    // GET /demandes-immersion returns an empty list.
    supertest(app)
      .get(`/${demandesImmersionRoute}`)
      .auth("e2e_tests", "e2e")
      .expect("Content-Type", /json/)
      .expect(200)

      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).toEqual([]);

        // POSTing a valid demande d'immersion succeeds.
        supertest(app)
          .post(`/${demandesImmersionRoute}`)
          .send(demandeImmersion)
          .expect(200)
          .expect("Content-Type", /json/)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.id).toEqual(demandeImmersionId);

            // GETting the new demande d'immersion succeeds.
            supertest(app)
              .get(`/${demandesImmersionRoute}/${demandeImmersionId}`)
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

  it("updates an existing demandeImmersion and returns it", (done) => {
    const demandeImmersionId = "test_id_2";
    const demandeImmersion = new DemandeImmersionDtoBuilder()
      .withId(demandeImmersionId)
      .build();

    // POSTing a valid demande d'immersion succeeds.
    supertest(app)
      .post(`/${demandesImmersionRoute}`)
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
          .post(`/${demandesImmersionRoute}/${demandeImmersionId}`)
          .send(updatedDemandeImmersion)
          .expect(200)
          .expect("Content-Type", /json/)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.id).toEqual(demandeImmersionId);

            // GETting the updated demandeImmersion succeeds.
            supertest(app)
              .get(`/${demandesImmersionRoute}/${demandeImmersionId}`)
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

  it("fetching unknown demandeImmersion IDs reports 404 Not Found", (done) => {
    supertest(app)
      .get(`/${demandesImmersionRoute}/unknown-demande-immersion-id`)
      .expect(404, done);
  });

  it("posting to unknown demandeImmersion IDs reports 404 Not Found", (done) => {
    const unknownId = "unknown-demande-immersion-id";
    const demandeImmersionWithUnknownId = new DemandeImmersionDtoBuilder()
      .withId(unknownId)
      .build();

    supertest(app)
      .post(`/${demandesImmersionRoute}/${unknownId}`)
      .send(demandeImmersionWithUnknownId)
      .expect(404, done);
  });

  it("creating a demande d'immersion with an existing ID reports 409 Conflict", (done) => {
    const demandeImmersionId = "test_id_3";
    const demandeImmersion = new DemandeImmersionDtoBuilder()
      .withId(demandeImmersionId)
      .build();

    // POSTing a valid demande immersion succeeds.
    supertest(app)
      .post(`/${demandesImmersionRoute}`)
      .send(demandeImmersion)
      .expect(200)
      .expect("Content-Type", /json/)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.id).toEqual(demandeImmersionId);

        const demandeImmersionWithExistingId = {
          ...demandeImmersion,
          email: "another@email.fr",
        };
        supertest(app)
          .post(`/${demandesImmersionRoute}`)
          .send(demandeImmersionWithExistingId)
          .expect(409, done);
      });
  });

  it("Fails to fetch demandesImmersion without credentials", (done) => {
    supertest(app).get(`/${demandesImmersionRoute}`).expect(401, done);
  });

  it("Fails to fetch demandesImmersion with invalid credentials", (done) => {
    supertest(app)
      .get(`/${demandesImmersionRoute}`)
      .auth("not real user", "not real password")
      .expect(401, done);
  });

  it("Fetches demandesImmersion with valid credentials", (done) => {
    // GET /demandes-immersion succeeds with login/pass.
    supertest(app)
      .get(`/${demandesImmersionRoute}`)
      .auth("e2e_tests", "e2e")
      .expect("Content-Type", /json/)
      .expect(200, done);
  });
});
