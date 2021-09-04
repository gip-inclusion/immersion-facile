import {
  DemandeImmersionDto,
  demandeImmersionDtoSchema,
  DemandeImmersionStatus,
  demandeImmersionStatusFromString,
} from "../../shared/DemandeImmersionDto";
import { addDays } from "../../_testBuilders/test.helpers";
import {
  DATE_START,
  DATE_SUBMISSION,
  DemandeImmersionDtoBuilder,
} from "../../_testBuilders/DemandeImmersionDtoBuilder";

describe("demandeImmersionDtoSchema", () => {
  test("accepts valid demandeImmersion", () => {
    const demandeImmersion = new DemandeImmersionDtoBuilder().build();
    expectDemandeImmersionDtoToBeValid(demandeImmersion);
  });

  test("rejects misformatted submission dates", () => {
    const demandeImmersion = new DemandeImmersionDtoBuilder()
      .withDateSubmission("not-a-date")
      .build();

    expectDemandeImmersionDtoToBeInvalid(demandeImmersion);
  });

  test("rejects misformatted start dates", () => {
    const demandeImmersion = new DemandeImmersionDtoBuilder()
      .withDateStart("not-a-date")
      .build();

    expectDemandeImmersionDtoToBeInvalid(demandeImmersion);
  });

  test("rejects misformatted end dates", () => {
    const demandeImmersion = new DemandeImmersionDtoBuilder()
      .withDateEnd("not-a-date")
      .build();

    expectDemandeImmersionDtoToBeInvalid(demandeImmersion);
  });

  test("rejects start dates that are after the end date", () => {
    const demandeImmersion = new DemandeImmersionDtoBuilder()
      .withDateStart("2021-01-10")
      .withDateEnd("2021-01-03")
      .build();

    expectDemandeImmersionDtoToBeInvalid(demandeImmersion);
  });

  test("rejects end dates that are more than 28 days after the start date", () => {
    const demandeImmersion = new DemandeImmersionDtoBuilder()
      .withDateStart(DATE_START)
      .withDateEnd(addDays(DATE_START, 29))
      .build();

    expectDemandeImmersionDtoToBeInvalid(demandeImmersion);
  });

  test("accepts end dates that are <= 28 days after the start date", () => {
    const demandeImmersion = new DemandeImmersionDtoBuilder()
      .withDateStart(DATE_START)
      .withDateEnd(addDays(DATE_START, 28))
      .build();

    console.log(demandeImmersion);

    expectDemandeImmersionDtoToBeValid(demandeImmersion);
  });

  test("accepts start dates that are >= 2 days after the submission date", () => {
    const demandeImmersion = new DemandeImmersionDtoBuilder()
      .withDateSubmission(DATE_SUBMISSION)
      .withDateStart(addDays(DATE_SUBMISSION, 2))
      .build();

    expectDemandeImmersionDtoToBeValid(demandeImmersion);
  });

  test("rejects start dates that are < 2 days after the submission date", () => {
    const demandeImmersion = new DemandeImmersionDtoBuilder()
      .withDateSubmission(DATE_SUBMISSION)
      .withDateStart(addDays(DATE_SUBMISSION, 1))
      .build();

    expectDemandeImmersionDtoToBeInvalid(demandeImmersion);
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

const expectDemandeImmersionDtoToBeValid = (
  validDemandeImmersionDto: DemandeImmersionDto
) => {
  expect(() =>
    demandeImmersionDtoSchema.validateSync(validDemandeImmersionDto)
  ).not.toThrow();

  expect(
    demandeImmersionDtoSchema.validateSync(validDemandeImmersionDto)
  ).toBeTruthy();
};

const expectDemandeImmersionDtoToBeInvalid = (
  demandeImmersionDto: DemandeImmersionDto
) =>
  expect(() =>
    demandeImmersionDtoSchema.validateSync(demandeImmersionDto)
  ).toThrow();
