import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { InMemoryFormulaireRepository } from "../../../adapters/secondary/InMemoryFormulaireRepository";
import { validFormulaire } from "../entities/FormulaireEntityTestData";
import { expectPromiseToFailWithError } from "./../../../utils/test.helpers";
import { FormulaireEntity } from "./../entities/FormulaireEntity";
import { AddFormulaire } from "./AddFormulaire";

describe("Add Formulaire", () => {
  let repository: InMemoryFormulaireRepository;
  let addFormulaire: AddFormulaire;

  beforeEach(() => {
    repository = new InMemoryFormulaireRepository();
    addFormulaire = new AddFormulaire({ formulaireRepository: repository });
  });

  describe("When the formulaire is valid", () => {
    test("saves the formulaire in the repository", async () => {
      expect(await addFormulaire.execute(validFormulaire)).toEqual({
        id: validFormulaire.id,
      });

      expect(await repository.getFormulaire(validFormulaire.id)).toEqual(
        validFormulaire
      );
    });
  });

  describe("When a demande d'immersion with the given ID already exists", () => {
    test("throws a ConflictError", async () => {
      await repository.save(FormulaireEntity.create(validFormulaire));

      expectPromiseToFailWithError(
        addFormulaire.execute(validFormulaire),
        new ConflictError(validFormulaire.id)
      );
    });
  });
});
