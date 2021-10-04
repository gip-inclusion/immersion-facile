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
    const response = await romeSearch.execute("lapins");
    expect(response).toEqual([
      {
        profession: {
          romeCodeAppellation: "14704",
          description: "Éleveur / Éleveuse de lapins angoras",
        },
        matchRanges: [{ startIndexInclusive: 22, endIndexExclusive: 28 }],
      },
      {
        profession: {
          romeCodeMetier: "A1409",
          description: "Élevage de lapins et volailles",
        },
        matchRanges: [{ startIndexInclusive: 11, endIndexExclusive: 17 }],
      },
    ]);
  });

  test("returns empty list when no match is found ", async () => {
    expect(await romeSearch.execute("unknown_search_term")).toEqual([]);
  });
});
