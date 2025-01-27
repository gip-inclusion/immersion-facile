import { AppellationAndRomeDto, expectToEqual } from "shared";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryAppellationsGateway } from "../adapters/InMemoryAppellationsGateway";
import { InMemoryRomeRepository } from "../adapters/InMemoryRomeRepository";
import { AppellationSearch } from "./AppellationSearch";

describe("AppellationSearch Manual test, which take to long to run in CI", () => {
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

  it("has a fallback when diagoriente searchAppellations takes too long", async () => {
    appellationsGateway.setNextSearchAppellationsResult([
      { appellationCode: "19364", appellationLabel: "Secrétaire" },
    ]);

    const appellation: AppellationAndRomeDto = {
      romeCode: "M1607",
      appellationCode: "19364",
      appellationLabel: "Secrétaire",
      romeLabel: "Secrétariat",
    };

    const appellationFallback: AppellationAndRomeDto = {
      romeCode: "M1607",
      appellationCode: "19367",
      appellationLabel:
        "Secrétaire bureautique spécialisé / spécialisée - FALLBACK",
      romeLabel: "Secrétariat",
    };

    romeRepo.appellations = [appellation, appellationFallback];

    appellationsGateway.setDelayInMs(680);

    expectToEqual(
      await appellationSearch.execute({
        searchText: "secretaire",
        fetchAppellationsFromNaturalLanguage: true,
      }),
      [
        {
          appellation: appellation,
          matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 10 }],
        },
      ],
    );

    appellationsGateway.setDelayInMs(720);

    expectToEqual(
      await appellationSearch.execute({
        searchText: "secretaire",
        fetchAppellationsFromNaturalLanguage: true,
      }),
      [
        {
          appellation: appellation,
          matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 10 }],
        },
        {
          appellation: appellationFallback,
          matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 10 }],
        },
      ],
    );
  });
});
