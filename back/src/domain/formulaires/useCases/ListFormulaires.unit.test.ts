import { InMemoryFormulaireRepository } from "../../../adapters/secondary/InMemoryFormulaireRepository";
import { ListFormulaires } from "./ListFormulaires";
import { validFormulaire } from "../entities/FormulaireEntityTestData";
import { FormulaireEntity } from "../entities/FormulaireEntity";

describe("List Formulaires", () => {
  let repository: InMemoryFormulaireRepository;
  let listFormulaires: ListFormulaires;

  beforeEach(() => {
    repository = new InMemoryFormulaireRepository();
    listFormulaires = new ListFormulaires({ formulaireRepository: repository });
  });

  describe("When the repository is empty", () => {
    test("returns empty list", async () => {
      const formulaires = await listFormulaires.execute();
      expect(formulaires).toEqual([]);
    });
  });

  describe("When a formulaire is stored", () => {
    test("returns the formulaire", async () => {
      const form = FormulaireEntity.create(validFormulaire);
      repository.setFormulaires({"form_id": form});

      const formulaires = await listFormulaires.execute();
      expect(formulaires).toEqual([form]);
    });
  });
});
