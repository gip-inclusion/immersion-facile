import type { RomeDto } from "shared";
import { createInMemoryUow } from "../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import { InMemoryRomeRepository } from "../adapters/InMemoryRomeRepository";
import { makeRomeSearch } from "./RomeSearch";

describe("RomeSearch", () => {
  const prepareUseCase = () => {
    const romeRepo = new InMemoryRomeRepository();
    const uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      romeRepository: romeRepo,
    });
    return makeRomeSearch({ uowPerformer });
  };
  it("returns the list of found matches with ranges", async () => {
    const useCase = prepareUseCase();

    const response = await useCase.execute("lapins");
    const expected: RomeDto[] = [
      {
        romeCode: "A1409",
        romeLabel: "Élevage",
      },
    ];
    expect(response).toEqual(expected);
  });

  it("issues no queries for short search texts", async () => {
    const useCase = prepareUseCase();
    const response = await useCase.execute("l");
    expect(response).toEqual([]);
  });
});
