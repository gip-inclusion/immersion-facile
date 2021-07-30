import { FormulaireEntity } from "./FormulaireEntity";

describe("FormulaireEntity", () => {
  const VALID_EMAIL = "valid@email.fr";
  const DATE_START = new Date(1000);
  const DATE_END = new Date(1001);

  describe("Valid parameters", () => {
    test("constructor creates a FormulaireEntity", () => {
      const entity = FormulaireEntity.create({
        email: VALID_EMAIL,
        dateStart: DATE_START,
        dateEnd: DATE_END,
      });
      expect(entity.email).toEqual(VALID_EMAIL);
      expect(entity.dateStart).toEqual(DATE_START);
      expect(entity.dateEnd).toEqual(DATE_END);
    });
  });

  describe("Email doesn't match RFC 5322", () => {
    test("constructor throws error", () => {
      const invalidRequest = {
        email: "not_a_valid_email",
        dateStart: DATE_START,
        dateEnd: DATE_END,
      };

      expect(() => FormulaireEntity.create(invalidRequest)).toThrowError(
        "Email must match the RFC standard: not_a_valid_email"
      );
    });
  });

  describe("Start date is after end date", () => {
    test("constructor throws error", () => {
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
});
