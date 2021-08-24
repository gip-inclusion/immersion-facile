import supertest from "supertest";
import {
  TEST_ESTABLISHMENT1,
  TEST_ESTABLISHMENT1_SIRET,
} from "../../secondary/InMemorySireneRepository";
import { app } from "../server";

describe("/siret route", () => {
  it("forwards valid requests", (done) => {
    supertest(app)
      .get(`/siret/${TEST_ESTABLISHMENT1_SIRET}`)
      .expect(
        200,
        {
          header: {
            statut: 200,
            message: "OK",
            total: 1,
            debut: 0,
            nombre: 1,
          },
          etablissements: [TEST_ESTABLISHMENT1],
        },
        done
      );
  });

  it("returns 404 Not Found for unknown siret", (done) => {
    supertest(app)
    .get("/siret/unknown-siret")
    .expect(404, done);
  });
});
