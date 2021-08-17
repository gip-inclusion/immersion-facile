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

    it("rejects email addresses that do not match RFC 5322", () => {
      const invalidRequest = { ...validFormulaire };
      invalidRequest.email = "not_a_valid_email";

      expect(() => FormulaireEntity.create(invalidRequest)).toThrowError(
        "Email must match the RFC standard: not_a_valid_email"
      );
    });

    it("rejects start dates that are after the end date", () => {
      const invalidRequest = { ...validFormulaire };
      invalidRequest.dateEnd = DATE_START;
      invalidRequest.dateStart = DATE_END;

      expect(() => FormulaireEntity.create(invalidRequest)).toThrowError(
        "The start date must be before the end date."
      );
    });
  });

  describe("formulaireEntityToDto()", () => {
    it("converts entities to DTOs", () => {
      const entity = FormulaireEntity.create(validFormulaire);
      const dto = formulaireEntityToDto(entity);
      expect(dto.email).toEqual(VALID_EMAILS[0]);
      expect(dto.dateStart).toEqual(DATE_START);
      expect(dto.dateEnd).toEqual(DATE_END);
    });
  });
});
