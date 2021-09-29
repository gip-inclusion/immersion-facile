import { InMemoryRomeGateway } from "./../../../adapters/secondary/InMemoryRomeGateway";
import { RomeSearch } from "./../../../domain/rome/useCases/RomeSearch";

describe("RomeSearch", () => {
  let repository: InMemoryRomeGateway;
  let romeSearch: RomeSearch;

  beforeEach(() => {
    repository = new InMemoryRomeGateway();
    romeSearch = new RomeSearch(repository);
  });

  test("returns the list of found matches with ranges", async () => {
    const response = await romeSearch.execute("vente");
    expect(response).toEqual([
      {
        romeCodeMetier: "D1106",
        description: "Vente en alimentation",
        matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 5 }],
      },
      {
        romeCodeMetier: "D1201",
        description: "Achat vente d'objets d'art, anciens ou d'occasion",
        matchRanges: [{ startIndexInclusive: 6, endIndexExclusive: 11 }],
      },
    ]);
  });

  test("returns empty list when no match is found ", async () => {
    expect(await romeSearch.execute("unknown_search_term")).toEqual([]);
  });
});
