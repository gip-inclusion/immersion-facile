import { AppellationMatchDto } from "shared";
import { InMemoryAppellationsGateway } from "../../../../adapters/secondary/appellationsGateway/InMemoryAppellationsGateway";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryRomeRepository } from "../adapters/InMemoryRomeRepository";
import { AppellationsGateway } from "../ports/AppellationsGateway";
import { RomeRepository } from "../ports/RomeRepository";
import { AppellationSearch } from "./AppellationSearch";

describe("AppellationSearch", () => {
  let romeRepo: RomeRepository;
  let appellationsGateway: AppellationsGateway;

  beforeEach(() => {
    romeRepo = new InMemoryRomeRepository();
    appellationsGateway = new InMemoryAppellationsGateway();
  });

  const createUseCase = () => {
    const uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      romeRepository: romeRepo,
    });
    return new AppellationSearch(uowPerformer, appellationsGateway);
  };

  it("returns the list of found matches with ranges", async () => {
    const response = await createUseCase().execute({
      searchText: "lapins",
      fetchAppellationsFromNaturalLanguage: false,
    });
    const expected: AppellationMatchDto[] = [
      {
        appellation: {
          appellationCode: "14704",
          appellationLabel: "Éleveur / Éleveuse de lapins angoras",
          romeCode: "A1409",
          romeLabel: "Élevage",
        },
        matchRanges: [{ startIndexInclusive: 22, endIndexExclusive: 28 }],
      },
    ];
    expect(response).toEqual(expected);
  });

  it("returns the list of found matches with ranges from minimum search caracters", async () => {
    const response = await createUseCase().execute({
      searchText: "lap",
      fetchAppellationsFromNaturalLanguage: false,
    });
    const expected: AppellationMatchDto[] = [
      {
        appellation: {
          appellationCode: "14704",
          appellationLabel: "Éleveur / Éleveuse de lapins angoras",
          romeCode: "A1409",
          romeLabel: "Élevage",
        },
        matchRanges: [{ startIndexInclusive: 22, endIndexExclusive: 25 }],
      },
    ];
    expect(response).toEqual(expected);
  });

  it("issues no queries for short search texts", async () => {
    const mockSearchMetierFn = jest.fn();
    const mockSearchAppellationFn = jest.fn();
    const mockAppellationToCodeMetier = jest.fn();
    const mockGetFullAppellationsFromCodes = jest.fn();
    romeRepo = {
      searchRome: mockSearchMetierFn,
      searchAppellation: mockSearchAppellationFn,
      appellationToCodeMetier: mockAppellationToCodeMetier,
      getAppellationAndRomeDtosFromAppellationCodes:
        mockGetFullAppellationsFromCodes,
    };

    const response = await createUseCase().execute({
      searchText: "l",
      fetchAppellationsFromNaturalLanguage: false,
    });
    expect(mockSearchMetierFn.mock.calls).toHaveLength(0);
    expect(mockSearchAppellationFn.mock.calls).toHaveLength(0);
    expect(response).toEqual([]);
  });

  it("returns empty list when no match is found", async () => {
    expect(
      await createUseCase().execute({
        searchText: "unknown_search_term",
        fetchAppellationsFromNaturalLanguage: false,
      }),
    ).toEqual([]);
  });
});
