import {
  ApplicationSource,
  applicationSourceFromString,
  ApplicationStatus,
  applicationStatusFromString,
  DemandeImmersionDto,
  demandeImmersionDtoSchema,
} from "../../shared/DemandeImmersionDto";
import {
  DATE_START,
  DATE_SUBMISSION,
  DemandeImmersionDtoBuilder,
} from "../../_testBuilders/DemandeImmersionDtoBuilder";
import { addDays } from "../../_testBuilders/test.helpers";

describe("demandeImmersionDtoSchema", () => {
  test("accepts valid demandeImmersion", () => {
    const demandeImmersion = new DemandeImmersionDtoBuilder().build();
    expectDemandeImmersionDtoToBeValid(demandeImmersion);
  });

  test("rejects equal applicant and mentor emails", () => {
    const demandeImmersion = new DemandeImmersionDtoBuilder()
      .withEmail("demandeur@mail.fr")
      .withMentorEmail("demandeur@mail.fr")
      .build();

    expectDemandeImmersionDtoToBeInvalid(demandeImmersion);
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

describe("applicationStatusFromString", () => {
  test("accepts valid enum values", () => {
    expectApplicationStatusToBe(applicationStatusFromString("DRAFT"), "DRAFT");
    expectApplicationStatusToBe(
      applicationStatusFromString("FINALIZED"),
      "FINALIZED"
    );
  });

  test("converts invalid enum values to UNKNOWN", () => {
    expectApplicationStatusToBe(applicationStatusFromString(""), "UNKNOWN");
    expectApplicationStatusToBe(
      applicationStatusFromString("UNKNOWN_VALUE"),
      "UNKNOWN"
    );
  });
});

const expectApplicationStatusToBe = (
  actual: ApplicationStatus,
  expected: ApplicationStatus
) => expect(actual).toBe(expected);

describe("applicationSourceFromString", () => {
  test("accepts valid enum values", () => {
    expectApplicationSourceToBe(
      applicationSourceFromString("GENERIC"),
      "GENERIC"
    );
    expectApplicationSourceToBe(
      applicationSourceFromString("BOULOGNE_SUR_MER"),
      "BOULOGNE_SUR_MER"
    );
  });

  test("converts invalid enum values to UNKNOWN", () => {
    expectApplicationSourceToBe(applicationSourceFromString(""), "UNKNOWN");
    expectApplicationSourceToBe(
      applicationSourceFromString("UNKNOWN_VALUE"),
      "UNKNOWN"
    );
  });
});

const expectApplicationSourceToBe = (
  actual: ApplicationSource,
  expected: ApplicationSource
) => expect(actual).toBe(expected);

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
