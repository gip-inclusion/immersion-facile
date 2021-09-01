import { AddDemandeImmersion } from "./AddDemandeImmersion";
import { InMemoryDemandeImmersionRepository } from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { validDemandeImmersion } from "../entities/DemandeImmersionIdEntityTestData";

describe("Add demandeImmersion", () => {
  let repository: InMemoryDemandeImmersionRepository;
  let addDemandeImmersion: AddDemandeImmersion;

  beforeEach(() => {
    repository = new InMemoryDemandeImmersionRepository();
    addDemandeImmersion = new AddDemandeImmersion({
      demandeImmersionRepository: repository,
    });
  });

  describe("When the demandeImmersion is valid", () => {
    test("saves the demandeImmersion in the repository", async () => {
      expect(await addDemandeImmersion.execute(validDemandeImmersion)).toEqual({
        id: validDemandeImmersion.id,
      });

      const storedInRepo = await repository.getAll();
      expect(storedInRepo.length).toBe(1);
      expect(storedInRepo[0].toDto()).toEqual(validDemandeImmersion);
    });
  });
});
