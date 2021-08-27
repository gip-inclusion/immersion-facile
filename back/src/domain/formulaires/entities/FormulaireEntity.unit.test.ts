import { formulaireDtoSchema } from "../../../shared/FormulaireDto";
import { FormulaireEntity, formulaireEntityToDto } from "./FormulaireEntity";
import { validFormulaire, VALID_EMAILS, DATE_START, DATE_END } from "./FormulaireEntityTestData";

describe("FormulaireEntity", () => {

  describe("FormulaireEntity.create()", () => {
    it("creates a FormulaireEntity for valid parameters", () => {
      const entity = FormulaireEntity.create(validFormulaire);
      expect(entity.email).toEqual(VALID_EMAILS[0]);
      expect(entity.dateStart).toEqual(DATE_START);
      expect(entity.dateEnd).toEqual(DATE_END);
    });

    it("rejects invalid parameters", () => {
      const invalidFormulaire = {
        ...validFormulaire,
        email: "not_a_valid_email"
      };
      expect(() => FormulaireEntity.create(invalidFormulaire)).toThrow();
    });
  });

  describe("formulaireEntityToDto()", () => {
    it("converts entities to DTOs", () => {
      const entity = FormulaireEntity.create(validFormulaire);
      expect(formulaireEntityToDto(entity)).toEqual(validFormulaire);
    });
  });
});
