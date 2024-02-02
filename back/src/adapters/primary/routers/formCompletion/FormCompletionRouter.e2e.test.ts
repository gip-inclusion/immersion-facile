import {
  FormCompletionRoutes,
  displayRouteName,
  expectHttpResponseToEqual,
  formCompletionRoutes,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { buildTestApp } from "../../../../utils/buildTestApp";
import { EstablishmentAggregateBuilder } from "../../../secondary/offer/InMemoryEstablishmentAggregateRepository";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../secondary/siret/InMemorySiretGateway";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe("formCompletion Routes", () => {
  let httpClient: HttpClient<FormCompletionRoutes>;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    const testApp = await buildTestApp();
    inMemoryUow = testApp.inMemoryUow;
    httpClient = createSupertestSharedClient(
      formCompletionRoutes,
      testApp.request,
    );
  });

  describe(`${displayRouteName(formCompletionRoutes.appellation)}`, () => {
    it("200 - forwards valid requests", async () => {
      const response = await httpClient.appellation({
        queryParams: { searchText: "trail" },
      });
      expectHttpResponseToEqual(response, {
        body: [
          {
            appellation: {
              appellationCode: "20714",
              appellationLabel: "Vitrailliste",
              romeCode: "B1602",
              romeLabel: "Vitraillerie",
            },
            matchRanges: [
              {
                startIndexInclusive: 2,
                endIndexExclusive: 7,
              },
            ],
          },
        ],
        status: 200,
      });
    });
  });

  describe(`${displayRouteName(formCompletionRoutes.getSiretInfo)}`, () => {
    it("200 - processes valid requests", async () => {
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

    it("400 - invalid request", async () => {
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

    it("404 - unknown siret", async () => {
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
  });

  describe(`${displayRouteName(
    formCompletionRoutes.getSiretInfoIfNotAlreadySaved,
  )}`, () => {
    it("409 - Conflict for siret already in db", async () => {
      const establishmentAggregate =
        new EstablishmentAggregateBuilder().build();
      inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
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
});
