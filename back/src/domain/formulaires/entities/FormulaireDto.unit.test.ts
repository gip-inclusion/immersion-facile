import {
  formulaireDtoSchema,
  FormulaireStatus,
  formulaireStatusFromString,
} from "../../../shared/FormulaireDto";
import { addDays } from "../../../utils/test.helpers";
import { updateFormulaireRequestDtoSchema } from "./../../../shared/FormulaireDto";
import {
  DATE_END,
  DATE_START,
  DATE_SUBMISSION,
  validFormulaire,
} from "./FormulaireEntityTestData";

describe("formulaireDtoSchema", () => {
  test("accepts valid formulaire", () => {
    expect(() =>
      formulaireDtoSchema.validateSync(validFormulaire)
    ).not.toThrow();
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

  test("rejects start dates that are after the end date", () => {
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

  test("accepts start dates that are >= 2 days after the submission date", () => {
    const invalidFormulaire = {
      ...validFormulaire,
      dateSubmission: DATE_SUBMISSION,
      dateStart: addDays(DATE_SUBMISSION, 2),
    };
    expect(() =>
      formulaireDtoSchema.validateSync(invalidFormulaire)
    ).not.toThrow();
  });

  test("rejects start dates that are < 2 days after the submission date", () => {
    const invalidFormulaire = {
      ...validFormulaire,
      dateSubmission: DATE_SUBMISSION,
      dateStart: addDays(DATE_SUBMISSION, 1),
    };
    expect(() => formulaireDtoSchema.validateSync(invalidFormulaire)).toThrow();
  });
});

describe("updateFormulaireRequestDtoSchema", () => {
  test("accepts requests with an ID match", () => {
    const invalidRequest = {
      id: validFormulaire.id,
      formulaire: validFormulaire,
    };
    expect(() =>
      updateFormulaireRequestDtoSchema.validateSync(invalidRequest)
    ).not.toThrow();
  });
  test("rejects requests with an ID mismatch", () => {
    const invalidRequest = {
      id: "not" + validFormulaire.id,
      formulaire: validFormulaire,
    };
    expect(() =>
      updateFormulaireRequestDtoSchema.validateSync(invalidRequest)
    ).toThrow();
  });
});

describe("FormulaireStateUtil", () => {
  test("formulaireStatusFromString() accepts valid enum values", () => {
    expectFormulaireStatusToBe(formulaireStatusFromString("DRAFT"), "DRAFT");
    expectFormulaireStatusToBe(
      formulaireStatusFromString("FINALIZED"),
      "FINALIZED"
    );
  });

  test("formulaireStatusFromString() converts invalid enum values to UNKNOWN", () => {
    expectFormulaireStatusToBe(formulaireStatusFromString(""), "UNKNOWN");
    expectFormulaireStatusToBe(
      formulaireStatusFromString("UNKNOWN_VALUE"),
      "UNKNOWN"
    );
  });
});

const expectFormulaireStatusToBe = (
  status: FormulaireStatus,
  expectedStatus: FormulaireStatus
) => expect(status).toBe(expectedStatus);
