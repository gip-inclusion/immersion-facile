import { InMemoryRomeGateway } from "./../../../adapters/secondary/InMemoryRomeGateway";
import { RomeSearch } from "./../../../domain/rome/useCases/RomeSearch";

describe("RomeSearch", () => {
  let repository: InMemoryRomeGateway;
  let romeSearch: RomeSearch;

  beforeEach(() => {
    repository = new InMemoryRomeGateway();
    romeSearch = new RomeSearch(repository);
  });

  it("returns the list of found matches", async () => {
    const response = await romeSearch.execute("vente");
    expect(response).toEqual([
      {
        romeCodeMetier: "D1106",
        description: "Vente en alimentation",
        matchRanges: [],
      },
      {
        romeCodeMetier: "D1211",
        description: "Vente en articles de sport et loisirs",
        matchRanges: [],
      },
    ]);
  });

  it("returns empty list when no match is found ", async () => {
    expect(await romeSearch.execute("unknown_search_term")).toEqual([]);
  });
});
