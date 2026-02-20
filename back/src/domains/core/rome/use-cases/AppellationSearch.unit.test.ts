import { expectToEqual } from "shared";
import { createInMemoryUow } from "../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import { InMemoryAppellationsGateway } from "../adapters/InMemoryAppellationsGateway";
import { InMemoryRomeRepository } from "../adapters/InMemoryRomeRepository";
import { AppellationSearch } from "./AppellationSearch";

describe("AppellationSearch", () => {
  let romeRepo: InMemoryRomeRepository;
  let appellationsGateway: InMemoryAppellationsGateway;
  let appellationSearch: AppellationSearch;

  beforeEach(() => {
    romeRepo = new InMemoryRomeRepository();
    appellationsGateway = new InMemoryAppellationsGateway();
    appellationSearch = new AppellationSearch(
      new InMemoryUowPerformer({
        ...createInMemoryUow(),
        romeRepository: romeRepo,
      }),
      appellationsGateway,
    );
  });

  it("returns the list of found matches with ranges", async () => {
    expectToEqual(
      await appellationSearch.execute({
        searchText: "lapins",
      }),
      [
        {
          appellation: {
            appellationCode: "14704",
            appellationLabel: "Éleveur / Éleveuse de lapins angoras",
            romeCode: "A1409",
            romeLabel: "Élevage",
          },
          matchRanges: [{ startIndexInclusive: 22, endIndexExclusive: 28 }],
        },
      ],
    );
  });

  it("returns the list of found matches with ranges from minimum search characters", async () => {
    expectToEqual(
      await appellationSearch.execute({
        searchText: "lap",
      }),
      [
        {
          appellation: {
            appellationCode: "14704",
            appellationLabel: "Éleveur / Éleveuse de lapins angoras",
            romeCode: "A1409",
            romeLabel: "Élevage",
          },
          matchRanges: [{ startIndexInclusive: 22, endIndexExclusive: 25 }],
        },
      ],
    );
  });

  it("issues no queries for short search texts", async () => {
    expectToEqual(
      await appellationSearch.execute({
        searchText: "l",
      }),
      [],
    );
  });

  it("returns empty list when no match is found", async () => {
    expectToEqual(
      await appellationSearch.execute({
        searchText: "unknown_search_term",
      }),
      [],
    );
  });
  describe("with natural language search", () => {
    it("returns the list of found matches with ranges", async () => {
      appellationsGateway.setNextSearchAppellationsResult([
        { appellationCode: "19364", appellationLabel: "Secrétaire" },
        {
          appellationCode: "19367",
          appellationLabel: "Secrétaire bureautique spécialisé / spécialisée",
        },
      ]);

      romeRepo.appellations = [
        {
          romeCode: "M1607",
          appellationCode: "19364",
          appellationLabel: "Secrétaire",
          romeLabel: "Secrétariat",
        },
        {
          romeCode: "M1607",
          appellationCode: "19367",
          appellationLabel: "Secrétaire bureautique spécialisé / spécialisée",
          romeLabel: "Secrétariat",
        },
      ];

      expectToEqual(
        await appellationSearch.execute({
          searchText: "secret",
          fetchAppellationsFromNaturalLanguage: true,
        }),
        [
          {
            appellation: {
              romeCode: "M1607",
              appellationCode: "19364",
              appellationLabel: "Secrétaire",
              romeLabel: "Secrétariat",
            },
            matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 6 }],
          },
          {
            appellation: {
              romeCode: "M1607",
              appellationCode: "19367",
              appellationLabel:
                "Secrétaire bureautique spécialisé / spécialisée",
              romeLabel: "Secrétariat",
            },
            matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 6 }],
          },
        ],
      );
    });

    it("do not return results if missing on rome repo like ROME 4 results", async () => {
      appellationsGateway.setNextSearchAppellationsResult([
        { appellationCode: "19364", appellationLabel: "Secrétaire" },
        {
          appellationCode: "19367",
          appellationLabel: "Secrétaire bureautique spécialisé / spécialisée",
        },
      ]);

      romeRepo.appellations = [
        {
          romeCode: "M1607",
          appellationCode: "19364",
          appellationLabel: "Secrétaire",
          romeLabel: "Secrétariat",
        },
      ];

      expectToEqual(
        await appellationSearch.execute({
          searchText: "secret",
          fetchAppellationsFromNaturalLanguage: true,
        }),
        [
          {
            appellation: {
              romeCode: "M1607",
              appellationCode: "19364",
              appellationLabel: "Secrétaire",
              romeLabel: "Secrétariat",
            },
            matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 6 }],
          },
        ],
      );
    });

    it("returns empty array if no match", async () => {
      expectToEqual(
        await appellationSearch.execute({
          searchText: "unknown_search_term",
          fetchAppellationsFromNaturalLanguage: true,
        }),
        [],
      );
    });

    it("has a fallback when diagoriente appellations search returns empty array", async () => {
      expectToEqual(
        await appellationSearch.execute({
          searchText: "lapins",
          fetchAppellationsFromNaturalLanguage: true,
        }),
        [
          {
            appellation: {
              appellationCode: "14704",
              appellationLabel: "Éleveur / Éleveuse de lapins angoras",
              romeCode: "A1409",
              romeLabel: "Élevage",
            },
            matchRanges: [{ startIndexInclusive: 22, endIndexExclusive: 28 }],
          },
        ],
      );
    });
  });
});
