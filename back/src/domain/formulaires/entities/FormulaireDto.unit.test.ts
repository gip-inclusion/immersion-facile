import { formulaireDtoSchema, FormulaireStatus, FormulaireStatusUtil } from "../../../shared/FormulaireDto";
import { validFormulaire, DATE_START, DATE_END, DATE_SUBMISSION } from "./FormulaireEntityTestData";
import { addDays } from "date-fns";

describe("formulaireDtoSchema", () => {

  test('rejects start dates that are after the end date', () => {
    const invalidRequest = { ...validFormulaire };
    invalidRequest.dateEnd = DATE_START;
    invalidRequest.dateStart = DATE_END;

    expect(() => formulaireDtoSchema.validateSync(invalidRequest)).toThrow();
  });

  test("rejects end dates that are more than 28 days after the start date", () => {
    const invalidRequest = { ...validFormulaire };
    invalidRequest.dateStart = DATE_START;
    invalidRequest.dateEnd = addDays(DATE_START, 29);

    expect(() => formulaireDtoSchema.validateSync(invalidRequest)).toThrow();
  });

  test("accepts end dates that are <= 28 days after the start date", () => {
    const validRequest = { ...validFormulaire };
    validRequest.dateStart = DATE_START;
    validRequest.dateEnd = addDays(DATE_START, 28);

    expect(() => formulaireDtoSchema.validateSync(validRequest)).not.toThrow();
    expect(formulaireDtoSchema.validateSync(validRequest)).toBeTruthy();
  });

  test('accepts start dates that are >= 2 days after the submission date', () => {
    const invalidRequest = {
      ...validFormulaire,
      dateSubmission: DATE_SUBMISSION,
      dateStart: addDays(DATE_SUBMISSION, 2),
    };
    expect(() => formulaireDtoSchema.validateSync(invalidRequest)).not.toThrow();
  });

  test('rejects start dates that are < 2 days after the submission date', () => {
    const invalidRequest = {
      ...validFormulaire,
      dateSubmission: DATE_SUBMISSION,
      dateStart: addDays(DATE_SUBMISSION, 1),
    };
    expect(() => formulaireDtoSchema.validateSync(invalidRequest)).toThrow();
  });
});

describe("FormulaireStateUtil", () => {
  test('fromString() accepts valid enum values', () => {
    expect(FormulaireStatusUtil.fromString("DRAFT")).toEqual(FormulaireStatus.DRAFT);
    expect(FormulaireStatusUtil.fromString("FINALIZED")).toEqual(FormulaireStatus.FINALIZED);
  });

  test('fromString() converts invalid enum values to UNKNOWN', () => {
    expect(FormulaireStatusUtil.fromString("")).toEqual(FormulaireStatus.UNKNOWN);
    expect(FormulaireStatusUtil.fromString("UNKNOWN_VALUE")).toEqual(FormulaireStatus.UNKNOWN);
  });
});
