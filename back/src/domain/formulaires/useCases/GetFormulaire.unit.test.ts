import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { InMemoryFormulaireRepository } from "../../../adapters/secondary/InMemoryFormulaireRepository";
import { expectPromiseToFailWithError } from "../../../utils/test.helpers";
import { FormulaireEntity } from "../entities/FormulaireEntity";
import { validFormulaire } from "../entities/FormulaireEntityTestData";
import { GetFormulaire } from "./GetFormulaire";

describe("Get Formulaire", () => {
  let repository: InMemoryFormulaireRepository;
  let getFormulaire: GetFormulaire;

  beforeEach(() => {
    repository = new InMemoryFormulaireRepository();
    getFormulaire = new GetFormulaire({ formulaireRepository: repository });
  });

  describe("When the formulaire does not exist", () => {
    it("throws NotFoundError", async () => {
      expectPromiseToFailWithError(
        getFormulaire.execute({ id: "unknown_formulaire_id" }),
        new NotFoundError("unknown_formulaire_id")
      );
    });
  });

  describe("When a formulaire is stored", () => {
    it("returns the formulaire", async () => {
      repository.setFormulaires({
        test_id: FormulaireEntity.create(validFormulaire),
      });

      const formulaire = await getFormulaire.execute({ id: "test_id" });
      expect(formulaire).toEqual(validFormulaire);
    });
  });
});
