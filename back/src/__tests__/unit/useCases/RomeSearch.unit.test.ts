import { RomeGateway } from "../../../domain/rome/ports/RomeGateway";
import { InMemoryRomeGateway } from "./../../../adapters/secondary/InMemoryRomeGateway";
import { RomeSearch } from "./../../../domain/rome/useCases/RomeSearch";

describe("RomeSearch", () => {
  let gateway: RomeGateway;

  beforeEach(() => {
    gateway = new InMemoryRomeGateway();
  });

  const createUseCase = () => {
    return new RomeSearch(gateway);
  };

  test("returns the list of found matches with ranges", async () => {
    const response = await createUseCase().execute("lapins");
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

  test("issues no queries for short search texts", async () => {
    const mockSearchMetierFn = jest.fn();
    const mockSearchAppellationFn = jest.fn();
    const mockAppellationToCodeMetier = jest.fn();
    gateway = {
      searchMetier: mockSearchMetierFn,
      searchAppellation: mockSearchAppellationFn,
      appellationToCodeMetier: mockAppellationToCodeMetier,
    };

    const response = await createUseCase().execute("lap");
    expect(mockSearchMetierFn.mock.calls).toHaveLength(0);
    expect(mockSearchAppellationFn.mock.calls).toHaveLength(0);
    expect(response).toEqual([]);
  });

  test("returns empty list when no match is found ", async () => {
    expect(await createUseCase().execute("unknown_search_term")).toEqual([]);
  });
});
