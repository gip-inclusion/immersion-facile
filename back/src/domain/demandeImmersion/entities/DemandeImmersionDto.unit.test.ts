import {
  demandeImmersionDtoSchema,
  DemandeImmersionStatus,
  demandeImmersionStatusFromString,
} from "../../../shared/DemandeImmersionDto";
import { addDays } from "../../../utils/test.helpers";
import {
  validDemandeImmersion,
  DATE_START,
  DATE_END,
  DATE_SUBMISSION,
} from "./DemandeImmersionIdEntityTestData";

describe("demandeImmersionDtoSchema", () => {
  test("accepts valid demandeImmersion", () => {
    expect(() =>
      demandeImmersionDtoSchema.validateSync(validDemandeImmersion)
    ).not.toThrow();
  });

  test("rejects misformatted submission dates", () => {
    const invalidDemandeImmersion = {
      ...validDemandeImmersion,
      dateSubmission: "not-a-date",
    };
    expect(() =>
      demandeImmersionDtoSchema.validateSync(invalidDemandeImmersion)
    ).toThrow();
  });

  test("rejects misformatted start dates", () => {
    const invalidDemandeImmersion = {
      ...validDemandeImmersion,
      dateStart: "not-a-date",
    };
    expect(() =>
      demandeImmersionDtoSchema.validateSync(invalidDemandeImmersion)
    ).toThrow();
  });

  test("rejects misformatted end dates", () => {
    const invalidDemandeImmersion = {
      ...validDemandeImmersion,
      dateEnd: "not-a-date",
    };
    expect(() =>
      demandeImmersionDtoSchema.validateSync(invalidDemandeImmersion)
    ).toThrow();
  });

  test("rejects start dates that are after the end date", () => {
    const invalidDemandeImmersion = { ...validDemandeImmersion };
    invalidDemandeImmersion.dateEnd = DATE_START;
    invalidDemandeImmersion.dateStart = DATE_END;

    expect(() =>
      demandeImmersionDtoSchema.validateSync(invalidDemandeImmersion)
    ).toThrow();
  });

  test("rejects end dates that are more than 28 days after the start date", () => {
    const invalidDemandeImmersion = { ...validDemandeImmersion };
    invalidDemandeImmersion.dateStart = DATE_START;
    invalidDemandeImmersion.dateEnd = addDays(DATE_START, 29);

    expect(() =>
      demandeImmersionDtoSchema.validateSync(invalidDemandeImmersion)
    ).toThrow();
  });

  test("accepts end dates that are <= 28 days after the start date", () => {
    const validRequest = { ...validDemandeImmersion };
    validRequest.dateStart = DATE_START;
    validRequest.dateEnd = addDays(DATE_START, 28);

    expect(() =>
      demandeImmersionDtoSchema.validateSync(validRequest)
    ).not.toThrow();
    expect(demandeImmersionDtoSchema.validateSync(validRequest)).toBeTruthy();
  });

  test("accepts start dates that are >= 2 days after the submission date", () => {
    const invalidDemandeImmersion = {
      ...validDemandeImmersion,
      dateSubmission: DATE_SUBMISSION,
      dateStart: addDays(DATE_SUBMISSION, 2),
    };
    expect(() =>
      demandeImmersionDtoSchema.validateSync(invalidDemandeImmersion)
    ).not.toThrow();
  });

  test("rejects start dates that are < 2 days after the submission date", () => {
    const invalidDemandeImmersion = {
      ...validDemandeImmersion,
      dateSubmission: DATE_SUBMISSION,
      dateStart: addDays(DATE_SUBMISSION, 1),
    };
    expect(() =>
      demandeImmersionDtoSchema.validateSync(invalidDemandeImmersion)
    ).toThrow();
  });
});

describe("demandeImmersionStatusFromString", () => {
  test("demandeImmersionStatusFromString() accepts valid enum values", () => {
    expectDemandeImmersionStatusToBe(
      demandeImmersionStatusFromString("DRAFT"),
      "DRAFT"
    );
    expectDemandeImmersionStatusToBe(
      demandeImmersionStatusFromString("FINALIZED"),
      "FINALIZED"
    );
  });

  test("demandeImmersionStatusFromString() converts invalid enum values to UNKNOWN", () => {
    expectDemandeImmersionStatusToBe(
      demandeImmersionStatusFromString(""),
      "UNKNOWN"
    );
    expectDemandeImmersionStatusToBe(
      demandeImmersionStatusFromString("UNKNOWN_VALUE"),
      "UNKNOWN"
    );
  });
});

const expectDemandeImmersionStatusToBe = (
  status: DemandeImmersionStatus,
  expectedStatus: DemandeImmersionStatus
) => expect(status).toBe(expectedStatus);
