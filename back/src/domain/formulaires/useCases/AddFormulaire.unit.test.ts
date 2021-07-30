import { AddFormulaire } from "./AddFormulaire";
import { InMemoryFormulaireRepository } from "../../../adapters/secondary/InMemoryFormulaireRepository";

describe("Add Formulaire", () => {
  const EMAIL = "some@email.fr";
  const DATE_START = new Date(1000);
  const DATE_END = new Date(1001);

  let repository: InMemoryFormulaireRepository;
  let addFormulaire: AddFormulaire;

  beforeEach(() => {
    repository = new InMemoryFormulaireRepository();
    addFormulaire = new AddFormulaire({ formulaireRepository: repository });
  });

  describe("When the formulaire is valid", () => {
    test("saves the formulaire in the repository", async () => {
      await addFormulaire.execute({
        email: EMAIL,
        dateStart: DATE_START,
        dateEnd: DATE_END,
      });

      expect(await repository.getAllFormulaires()).toEqual([
        { email: EMAIL, dateStart: DATE_START, dateEnd: DATE_END },
      ]);
    });
  });
});
