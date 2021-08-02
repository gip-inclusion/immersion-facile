import { FormulaireEntity, formulaireEntityToDto } from "./FormulaireEntity";

describe("FormulaireEntity", () => {
  const VALID_EMAIL = "valid@email.fr";
  const DATE_START = new Date(1000);
  const DATE_END = new Date(1001);

  describe("FormulaireEntity.create()", () => {
    it("creates a FormulaireEntity for valid parameters", () => {
      const entity = FormulaireEntity.create({
        email: VALID_EMAIL,
        dateStart: DATE_START,
        dateEnd: DATE_END,
      });
      expect(entity.email).toEqual(VALID_EMAIL);
      expect(entity.dateStart).toEqual(DATE_START);
      expect(entity.dateEnd).toEqual(DATE_END);
    });

    it("rejects email addresses that do not match RFC 5322", () => {
      const invalidRequest = {
        email: "not_a_valid_email",
        dateStart: DATE_START,
        dateEnd: DATE_END,
      };

      expect(() => FormulaireEntity.create(invalidRequest)).toThrowError(
        "Email must match the RFC standard: not_a_valid_email"
      );
    });

    it("rejects start dates that are after the end date", () => {
      const invalidRequest = {
        email: VALID_EMAIL,
        dateStart: new Date(1000),
        dateEnd: new Date(999),  // dateEnd < dateStart
      };

      expect(() => FormulaireEntity.create(invalidRequest)).toThrowError(
        "The start date must be before the end date."
      );
    });
  });

  describe("formulaireEntityToDto()", () => {
    it("converts entities to DTOs", () => {
      const entity = FormulaireEntity.create({
        email: VALID_EMAIL,
        dateStart: DATE_START,
        dateEnd: DATE_END,
      });
      const dto = formulaireEntityToDto(entity);
      expect(dto.email).toEqual(VALID_EMAIL);
      expect(dto.dateStart).toEqual(DATE_START);
      expect(dto.dateEnd).toEqual(DATE_END);
    });
  });
});
