import supertest, { SuperTest, Test } from "supertest";
import { EstablishmentAggregateBuilder } from "../../_testBuilders/EstablishmentAggregateBuilder";
import { createApp } from "../../adapters/primary/server";
import { InMemoryEstablishmentAggregateRepository } from "../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { TEST_ESTABLISHMENT1 } from "../../adapters/secondary/InMemorySireneGateway";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";
import { getSiretIfNotSavedRoute } from "shared/src/routes";

describe("/siret route", () => {
  let request: SuperTest<Test>;
  let establishmentAggregateRepository: InMemoryEstablishmentAggregateRepository;

  beforeEach(async () => {
    const { app, repositories } = await createApp(
      new AppConfigBuilder().build(),
    );
    establishmentAggregateRepository =
      repositories.immersionOffer as InMemoryEstablishmentAggregateRepository;
    request = supertest(app);
  });

  it("processes valid requests", async () => {
    await request.get(`/siret/${TEST_ESTABLISHMENT1.siret}`).expect(200, {
      siret: "12345678901234",
      businessName: "MA P'TITE BOITE",
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      naf: { code: "7112B", nomenclature: "Ref2" },
      isOpen: true,
    });
  });

  it("returns 400 Bad Request for invalid request", async () => {
    await request.get("/siret/not_a_valid_siret").expect(400);
  });

  it("returns 404 Not Found for unknown siret", async () => {
    await request.get("/siret/40400000000404").expect(404);
  });

  it("returns 409 Conflict for siret already in db", async () => {
    const establishmentAggregate = new EstablishmentAggregateBuilder().build();
    establishmentAggregateRepository.establishmentAggregates = [
      establishmentAggregate,
    ];

    await request
      .get(
        `/${getSiretIfNotSavedRoute}/${establishmentAggregate.establishment.siret}`,
      )
      .expect(409);
  });
});
