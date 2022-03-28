import { createInMemoryUow } from "../../../adapters/primary/config";
import { InMemoryRomeRepository } from "../../../adapters/secondary/InMemoryRomeRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { RomeSearch } from "../../../domain/rome/useCases/RomeSearch";
import { RomeDto } from "../../../shared/romeAndAppellationDtos/romeAndAppellation.dto";

const prepareUseCase = () => {
  const romeRepo = new InMemoryRomeRepository();
  const uowPerformer = new InMemoryUowPerformer({
    ...createInMemoryUow(),
    romeRepo,
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
        romeLabel: "Élevage de lapins et volailles",
      },
    ];
    expect(response).toEqual(expected);
  });

  it("issues no queries for short search texts", async () => {
    const useCase = prepareUseCase();
    const response = await useCase.execute("lap");
    expect(response).toEqual([]);
  });
});
