import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  Formulaires,
  InMemoryFormulaireRepository,
} from "../../../adapters/secondary/InMemoryFormulaireRepository";
import { expectPromiseToFailWithError } from "../../../utils/test.helpers";
import { FormulaireEntity } from "../entities/FormulaireEntity";
import { validFormulaire } from "../entities/FormulaireEntityTestData";
import { UpdateFormulaire } from "./UpdateFormulaire";

describe("Update Formulaire", () => {
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
      formulaires[validFormulaire.id] =
        FormulaireEntity.create(validFormulaire);
      repository.setFormulaires(formulaires);

      const updatedFormulaire = {
        ...validFormulaire,
        email: "new@email.fr",
      };
      const id = await updateFormulaire.execute({
        id: updatedFormulaire.id,
        formulaire: updatedFormulaire,
      });
      expect(id).toEqual({ id: validFormulaire.id });

      expect(await repository.getAllFormulaires()).toEqual([updatedFormulaire]);
    });
  });

  describe("When no formulaire with id exists", () => {
    it("throws NotFoundError", async () => {
      const demandeImmersionWithUnknownId = {
        ...validFormulaire,
        id: "unknown_demande_immersion_id",
      };
      expectPromiseToFailWithError(
        updateFormulaire.execute({
          id: demandeImmersionWithUnknownId.id,
          formulaire: demandeImmersionWithUnknownId,
        }),
        new NotFoundError("unknown_demande_immersion_id")
      );
    });
  });
});
