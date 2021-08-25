import { FormulaireDto, formulaireDtoSchema } from "../../../shared/FormulaireDto";
import { validFormulaire, VALID_EMAILS, DATE_START, DATE_END } from "./FormulaireEntityTestData";
import { it } from "date-fns/locale";
import { expectPromiseToFailWith } from "../../../utils/test.helpers";

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

    let invalidEndDate = new Date(DATE_START);
    invalidEndDate.setDate(invalidEndDate.getDate() + 290 /* days */);
    invalidRequest.dateEnd = invalidEndDate;

    expect(() => formulaireDtoSchema.validateSync(invalidRequest)).toThrow();
  });

  test("accepts end dates that are <= 28 days after the start date", () => {
    const validRequest = { ...validFormulaire };
    validRequest.dateStart = DATE_START;

    let validEndDate = new Date(DATE_START);
    validEndDate.setDate(validEndDate.getDate() + 28 /* days */);
    validRequest.dateEnd = validEndDate;

    expect(() => formulaireDtoSchema.validateSync(validRequest)).not.toThrow();
    expect(formulaireDtoSchema.validateSync(validRequest)).toBeTruthy();
  });
});
