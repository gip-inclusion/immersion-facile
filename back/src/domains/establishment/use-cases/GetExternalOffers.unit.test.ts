import { errors, expectPromiseToFailWithError, expectToEqual } from "shared";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { InMemoryLaBonneBoiteGateway } from "../adapters/la-bonne-boite/InMemoryLaBonneBoiteGateway";
import { LaBonneBoiteCompanyDtoBuilder } from "../adapters/la-bonne-boite/LaBonneBoiteCompanyDtoBuilder";
import {
  type GetExternalOffers,
  makeGetExternalOffers,
} from "./GetExternalOffers";

describe("GetExternalOffers", () => {
  let uuidGenerator: TestUuidGenerator;
  let getExternalOffers: GetExternalOffers;
  let laBonneBoiteGateway: InMemoryLaBonneBoiteGateway;
  let uowPerformer: UnitOfWorkPerformer;

  beforeEach(() => {
    uowPerformer = new InMemoryUowPerformer(createInMemoryUow());
    uuidGenerator = new TestUuidGenerator();
    laBonneBoiteGateway = new InMemoryLaBonneBoiteGateway();
    getExternalOffers = makeGetExternalOffers({
      uowPerformer,
      deps: {
        uuidGenerator,
        laBonneBoiteGateway,
      },
    });
    uuidGenerator.setNextUuid("search-made-uuid");
  });

  describe("Right paths", () => {
    it("returns the search results with valid input params", async () => {
      const lbbResult = new LaBonneBoiteCompanyDtoBuilder().build();
      laBonneBoiteGateway.setNextResults([lbbResult]);
      const result = await getExternalOffers.execute(
        {
          appellationCodes: ["14704"],
          distanceKm: 30,
          latitude: 48.8531,
          longitude: 2.34999,
        },
        undefined,
      );

      expectToEqual(result, [
        {
          ...lbbResult.toSearchResult({
            romeCode: "A1409",
            romeLabel: "Élevage",
          }),
          distance_m: 276612,
        },
      ]);
    });
    it("handles multiple appellation codes", async () => {
      const lbbResultForAppellation14704 = new LaBonneBoiteCompanyDtoBuilder()
        .withRome("A1409")
        .build();
      const lbbResultForAppellation19540 = new LaBonneBoiteCompanyDtoBuilder()
        .withRome("B1805")
        .build();
      const lbbResults = [
        lbbResultForAppellation14704,
        lbbResultForAppellation19540,
      ];
      laBonneBoiteGateway.setNextResults(lbbResults);
      const result = await getExternalOffers.execute(
        {
          appellationCodes: ["14704", "19540"],
          distanceKm: 30,
          latitude: 48.8531,
          longitude: 2.34999,
        },
        undefined,
      );

      expectToEqual(
        result,
        lbbResults.map((lbbResult) => ({
          ...lbbResult.toSearchResult({
            // fake from in memory la bonne boite gateway, not relevant for the test
            romeCode: expect.any(String),
            romeLabel: expect.any(String),
          }),
          distance_m: 276612,
        })),
      );
    });

    it("handles naf codes", async () => {
      const lbbResultForExpectedNafCode = new LaBonneBoiteCompanyDtoBuilder()
        .withNaf({ code: "1072Z", nomenclature: "" })
        .build();
      const lbbResultForOtherNafCode = new LaBonneBoiteCompanyDtoBuilder()
        .withNaf({ code: "1072A", nomenclature: "" })
        .build();
      laBonneBoiteGateway.setNextResults([
        lbbResultForExpectedNafCode,
        lbbResultForOtherNafCode,
      ]);
      const result = await getExternalOffers.execute(
        {
          appellationCodes: ["14704"],
          nafCodes: ["1072Z"],
          distanceKm: 30,
          latitude: 48.8531,
          longitude: 2.34999,
        },
        undefined,
      );
      expectToEqual(result, [
        {
          ...lbbResultForExpectedNafCode.toSearchResult({
            romeCode: "A1409",
            romeLabel: "Élevage",
          }),
          distance_m: 276612,
        },
      ]);
    });
  });
  describe("Wrong paths", () => {
    it("throws a bad request error if geoparams provided but distanceKm is not valid", async () => {
      expectPromiseToFailWithError(
        getExternalOffers.execute(
          {
            appellationCodes: ["14704"],
            latitude: 10,
            longitude: 10,
            distanceKm: 0,
          },
          undefined,
        ),
        errors.inputs.badSchema({
          useCaseName: "GetExternalOffers",
          flattenErrors: ["distanceKm : Cette valeur doit être positive"],
        }),
      );
    });
    it("throws a not found error if the appellation codes are not found", async () => {
      const nonExistingAppellationCode = "99999";
      expectPromiseToFailWithError(
        getExternalOffers.execute(
          {
            appellationCodes: [nonExistingAppellationCode],
            distanceKm: 30,
            latitude: 48.8531,
            longitude: 2.34999,
          },
          undefined,
        ),
        errors.search.noRomeForAppellations([nonExistingAppellationCode]),
      );
    });
  });
});
