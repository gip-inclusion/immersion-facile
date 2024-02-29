import { RomeDto } from "shared";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryRomeRepository } from "../adapters/InMemoryRomeRepository";
import { RomeSearch } from "./RomeSearch";

const prepareUseCase = () => {
  const romeRepo = new InMemoryRomeRepository();
  const uowPerformer = new InMemoryUowPerformer({
    ...createInMemoryUow(),
    romeRepository: romeRepo,
  });
  return new RomeSearch(uowPerformer);
};

describe("RomeSearch", () => {
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
