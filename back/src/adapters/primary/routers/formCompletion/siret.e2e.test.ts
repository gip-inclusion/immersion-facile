import { SuperTest, Test } from "supertest";
import { expectToEqual, siretTargets } from "shared";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/EstablishmentAggregateBuilder";
import { InMemoryEstablishmentAggregateRepository } from "../../../secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../secondary/siret/InMemorySiretGateway";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

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
    const response = await request.get(
      siretTargets.getSiretInfo.url.replace(
        ":siret",
        TEST_OPEN_ESTABLISHMENT_1.siret,
      ),
    );

    expect(response.status).toBe(200);
    expectToEqual(response.body, {
      siret: "12345678901234",
      businessName: "MA P'TITE BOITE",
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      nafDto: { code: "7112B", nomenclature: "Ref2" },
      numberEmployeesRange: "3-5",
      isOpen: true,
    });
  });

  it("returns 400 Bad Request for invalid request", async () => {
    await request
      .get(siretTargets.getSiretInfo.url.replace(":siret", "not_a_valid_siret"))
      .expect(400);
  });

  it("returns 404 Not Found for unknown siret", async () => {
    await request
      .get(siretTargets.getSiretInfo.url.replace(":siret", "40400000000404"))
      .expect(404);
  });

  it("returns 409 Conflict for siret already in db", async () => {
    const establishmentAggregate = new EstablishmentAggregateBuilder().build();
    establishmentAggregateRepository.establishmentAggregates = [
      establishmentAggregate,
    ];

    await request
      .get(
        siretTargets.getSiretInfoIfNotAlreadySaved.url.replace(
          ":siret",
          establishmentAggregate.establishment.siret,
        ),
      )
      .expect(409);
  });
});
