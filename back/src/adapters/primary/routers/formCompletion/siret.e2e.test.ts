import { SuperTest, Test } from "supertest";
import { expectHttpResponseToEqual, SiretRoutes, siretRoutes } from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/establishmentAggregate.test.helpers";
import { InMemoryEstablishmentAggregateRepository } from "../../../secondary/offer/InMemoryEstablishmentAggregateRepository";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../secondary/siret/InMemorySiretGateway";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe("/siret route", () => {
  let establishmentAggregateRepository: InMemoryEstablishmentAggregateRepository;
  let inMemoryUow: InMemoryUnitOfWork;
  let httpClient: HttpClient<SiretRoutes>;

  beforeEach(async () => {
    let request: SuperTest<Test>;
    ({ request, inMemoryUow } = await buildTestApp());
    establishmentAggregateRepository =
      inMemoryUow.establishmentAggregateRepository;
    httpClient = createSupertestSharedClient(siretRoutes, request);
  });

  it("processes valid requests", async () => {
    const response = await httpClient.getSiretInfo({
      urlParams: { siret: TEST_OPEN_ESTABLISHMENT_1.siret },
    });

    expectHttpResponseToEqual(response, {
      status: 200,
      body: {
        siret: "12345678901234",
        businessName: "MA P'TITE BOITE",
        businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
        nafDto: { code: "7112B", nomenclature: "Ref2" },
        numberEmployeesRange: "3-5",
        isOpen: true,
      },
    });
  });

  it("returns 400 Bad Request for invalid request", async () => {
    const response = await httpClient.getSiretInfo({
      urlParams: { siret: "not_a_valid_siret" },
    });
    expectHttpResponseToEqual(response, {
      status: 400,
      body: {
        errors:
          'Error: [\n  {\n    "validation": "regex",\n    "code": "invalid_string",\n    "message": "SIRET doit être composé de 14 chiffres",\n    "path": [\n      "siret"\n    ]\n  }\n]',
      },
    });
  });

  it("returns 404 Not Found for unknown siret", async () => {
    const siret = "40400000000404";
    const response = await httpClient.getSiretInfo({
      urlParams: { siret },
    });
    expectHttpResponseToEqual(response, {
      status: 404,
      body: {
        errors: `Did not find establishment with siret : ${siret} in siret API`,
      },
    });
  });

  it("returns 409 Conflict for siret already in db", async () => {
    const establishmentAggregate = new EstablishmentAggregateBuilder().build();
    establishmentAggregateRepository.establishmentAggregates = [
      establishmentAggregate,
    ];

    const response = await httpClient.getSiretInfoIfNotAlreadySaved({
      urlParams: { siret: establishmentAggregate.establishment.siret },
    });

    expectHttpResponseToEqual(response, {
      status: 409,
      body: {
        errors: `Establishment with siret ${establishmentAggregate.establishment.siret} already in db`,
      },
    });
  });
});
