import { formulaireDtoSchema, FormulaireStatus, FormulaireStatusUtil } from "../../../shared/FormulaireDto";
import { addDays } from "../../../utils/test.helpers";
import { validFormulaire, DATE_START, DATE_END, DATE_SUBMISSION } from "./FormulaireEntityTestData";

describe("formulaireDtoSchema", () => {

  test("accepts valid formulaire", () => {
    expect(() => formulaireDtoSchema.validateSync(validFormulaire)).not.toThrow();
  });

  test("rejects misformatted submission dates", () => {
    const invalidFormulaire = {
      ...validFormulaire,
      dateSubmission: "not-a-date",
    };
    expect(() => formulaireDtoSchema.validateSync(invalidFormulaire)).toThrow();
  });

  test("rejects misformatted start dates", () => {
    const invalidFormulaire = {
      ...validFormulaire,
      dateStart: "not-a-date",
    };
    expect(() => formulaireDtoSchema.validateSync(invalidFormulaire)).toThrow();
  });

  test("rejects misformatted end dates", () => {
    const invalidFormulaire = {
      ...validFormulaire,
      dateEnd: "not-a-date",
    };
    expect(() => formulaireDtoSchema.validateSync(invalidFormulaire)).toThrow();
  });

  test('rejects start dates that are after the end date', () => {
    const invalidFormulaire = { ...validFormulaire };
    invalidFormulaire.dateEnd = DATE_START;
    invalidFormulaire.dateStart = DATE_END;

    expect(() => formulaireDtoSchema.validateSync(invalidFormulaire)).toThrow();
  });

  test("rejects end dates that are more than 28 days after the start date", () => {
    const invalidFormulaire = { ...validFormulaire };
    invalidFormulaire.dateStart = DATE_START;
    invalidFormulaire.dateEnd = addDays(DATE_START, 29);

    expect(() => formulaireDtoSchema.validateSync(invalidFormulaire)).toThrow();
  });

  test("accepts end dates that are <= 28 days after the start date", () => {
    const validRequest = { ...validFormulaire };
    validRequest.dateStart = DATE_START;
    validRequest.dateEnd = addDays(DATE_START, 28);

    expect(() => formulaireDtoSchema.validateSync(validRequest)).not.toThrow();
    expect(formulaireDtoSchema.validateSync(validRequest)).toBeTruthy();
  });

  test('accepts start dates that are >= 2 days after the submission date', () => {
    const invalidFormulaire = {
      ...validFormulaire,
      dateSubmission: DATE_SUBMISSION,
      dateStart: addDays(DATE_SUBMISSION, 2),
    };
    expect(() => formulaireDtoSchema.validateSync(invalidFormulaire)).not.toThrow();
  });

  test('rejects start dates that are < 2 days after the submission date', () => {
    const invalidFormulaire = {
      ...validFormulaire,
      dateSubmission: DATE_SUBMISSION,
      dateStart: addDays(DATE_SUBMISSION, 1),
    };
    expect(() => formulaireDtoSchema.validateSync(invalidFormulaire)).toThrow();
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
