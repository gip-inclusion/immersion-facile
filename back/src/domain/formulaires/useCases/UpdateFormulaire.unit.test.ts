import { UpdateFormulaire } from "./UpdateFormulaire";
import {
  Formulaires,
  InMemoryFormulaireRepository,
} from "../../../adapters/secondary/InMemoryFormulaireRepository";
import { validFormulaire } from "../entities/FormulaireEntityTestData";
import { FormulaireEntity } from "../entities/FormulaireEntity";
import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { expectPromiseToFailWithError } from "../../../utils/test.helpers";
import { FormulaireIdEntity } from "../entities/FormulaireIdEntity";

describe("Update Formulaire", () => {
  const FORMULAIRE_ID = "some_id";

  let repository: InMemoryFormulaireRepository;
  let updateFormulaire: UpdateFormulaire;

  beforeEach(() => {
    repository = new InMemoryFormulaireRepository();
    updateFormulaire = new UpdateFormulaire({
      formulaireRepository: repository,
    });
  });

  describe("When the formulaire is valid", () => {
    test("updates the formulaire in the repository", async () => {
      const formulaires: Formulaires = {};
      formulaires[FORMULAIRE_ID] = FormulaireEntity.create(validFormulaire);
      repository.setFormulaires(formulaires);

      const updatedFormulaire = {
        ...validFormulaire,
        email: "new@email.fr",
      };
      const id = await updateFormulaire.execute({
        id: FORMULAIRE_ID,
        formulaire: updatedFormulaire,
      });
      expect(id).toEqual(FormulaireIdEntity.create(FORMULAIRE_ID));

      expect(await repository.getAllFormulaires()).toEqual([updatedFormulaire]);
    });
  });

  describe("When no formulaire with id exists", () => {
    it("throws NotFoundError", async () => {
      expectPromiseToFailWithError(
        updateFormulaire.execute({
          id: "unknown_formulaire_id",
          formulaire: validFormulaire,
        }),
        new NotFoundError("unknown_formulaire_id")
      );
    });
  });
});
