import { getSiretIfNotSavedRoute } from "shared";
import { SuperTest, Test } from "supertest";
import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { EstablishmentAggregateBuilder } from "../../_testBuilders/EstablishmentAggregateBuilder";
import { InMemoryUnitOfWork } from "../../adapters/primary/config/uowConfig";
import { InMemoryEstablishmentAggregateRepository } from "../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { TEST_ESTABLISHMENT1 } from "../../adapters/secondary/InMemorySireneGateway";

describe("/siret route", () => {
  let request: SuperTest<Test>;
  let establishmentAggregateRepository: InMemoryEstablishmentAggregateRepository;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    ({ request, inMemoryUow } = await buildTestApp());
    establishmentAggregateRepository =
      inMemoryUow.establishmentAggregateRepository;
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
