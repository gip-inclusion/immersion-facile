import { InMemoryFormulaireRepository } from "../../../adapters/secondary/InMemoryFormulaireRepository";
import { ListFormulaires } from "./ListFormulaires";

describe("List Formulaires", () => {
  const EMAIL = "some@email.fr";
  const DATE_START = new Date(1000);
  const DATE_END = new Date(1001);

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
      repository.setFormulaires([{
        email: EMAIL,
        dateStart: DATE_START,
        dateEnd: DATE_END,
      }]);

      const formulaires = await listFormulaires.execute();
      expect(formulaires).toEqual([
        { email: EMAIL, dateStart: DATE_START, dateEnd: DATE_END },
      ]);
    });
  });
});
