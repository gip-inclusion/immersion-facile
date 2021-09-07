import supertest, { SuperTest, Test } from "supertest";
import { createApp } from "../../adapters/primary/server";
import {
  TEST_ESTABLISHMENT1,
  TEST_ESTABLISHMENT1_SIRET,
} from "../../adapters/secondary/InMemorySireneRepository";

describe("/siret route", () => {
  let request: SuperTest<Test>;

  beforeEach(() => {
    request = supertest(
      createApp({
        featureFlags: {
          enableViewableApplications: true,
        },
      })
    );
  });

  it("forwards valid requests", async () => {
    await request.get(`/siret/${TEST_ESTABLISHMENT1_SIRET}`).expect(200, {
      header: {
        statut: 200,
        message: "OK",
        total: 1,
        debut: 0,
        nombre: 1,
      },
      etablissements: [TEST_ESTABLISHMENT1],
    });
  });

  it("returns 404 Not Found for unknown siret", async () => {
    await request.get("/siret/unknown-siret").expect(404);
  });
});
