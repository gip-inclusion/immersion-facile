import { AddFormulaire } from "./AddFormulaire";
import { InMemoryFormulaireRepository } from "../../../adapters/secondary/InMemoryFormulaireRepository";
import { validFormulaire } from "../entities/FormulaireEntityTestData";

describe("Add Formulaire", () => {
  let repository: InMemoryFormulaireRepository;
  let addFormulaire: AddFormulaire;

  beforeEach(() => {
    repository = new InMemoryFormulaireRepository();
    addFormulaire = new AddFormulaire({ formulaireRepository: repository });
  });

  describe("When the formulaire is valid", () => {
    test("saves the formulaire in the repository", async () => {
      await addFormulaire.execute(validFormulaire);

      expect(await repository.getAllFormulaires()).toEqual([validFormulaire]);
    });
  });
});
