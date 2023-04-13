import { RomeDto } from "shared";

import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryRomeRepository } from "../../../adapters/secondary/InMemoryRomeRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";

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
    const response = await useCase.execute("la");
    expect(response).toEqual([]);
  });
});
