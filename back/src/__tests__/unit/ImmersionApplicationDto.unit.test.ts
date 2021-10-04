import {
  ApplicationSource,
  applicationSourceFromString,
  ApplicationStatus,
  applicationStatusFromString,
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "../../shared/ImmersionApplicationDto";
import {
  DATE_START,
  DATE_SUBMISSION,
  ImmersionApplicationDtoBuilder,
} from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { addDays } from "../../_testBuilders/test.helpers";

describe("demandeImmersionDtoSchema", () => {
  test("accepts valid immersionApplication", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder().build();
    expectDemandeImmersionDtoToBeValid(demandeImmersion);
  });

  test("rejects equal applicant and mentor emails", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withEmail("demandeur@mail.fr")
      .withMentorEmail("demandeur@mail.fr")
      .build();

    expectDemandeImmersionDtoToBeInvalid(demandeImmersion);
  });

  test("rejects misformatted submission dates", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withDateSubmission("not-a-date")
      .build();

    expectDemandeImmersionDtoToBeInvalid(demandeImmersion);
  });

  test("rejects misformatted start dates", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withDateStart("not-a-date")
      .build();

    expectDemandeImmersionDtoToBeInvalid(demandeImmersion);
  });

  test("rejects misformatted end dates", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withDateEnd("not-a-date")
      .build();

    expectDemandeImmersionDtoToBeInvalid(demandeImmersion);
  });

  test("rejects start dates that are after the end date", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withDateStart("2021-01-10")
      .withDateEnd("2021-01-03")
      .build();

    expectDemandeImmersionDtoToBeInvalid(demandeImmersion);
  });

  test("rejects end dates that are more than 28 days after the start date", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withDateStart(DATE_START)
      .withDateEnd(addDays(DATE_START, 29))
      .build();

    expectDemandeImmersionDtoToBeInvalid(demandeImmersion);
  });

  test("accepts end dates that are <= 28 days after the start date", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withDateStart(DATE_START)
      .withDateEnd(addDays(DATE_START, 28))
      .build();

    expectDemandeImmersionDtoToBeValid(demandeImmersion);
  });

  test("accepts start dates that are >= 2 days after the submission date", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withDateSubmission(DATE_SUBMISSION)
      .withDateStart(addDays(DATE_SUBMISSION, 2))
      .build();

    expectDemandeImmersionDtoToBeValid(demandeImmersion);
  });

  test("rejects start dates that are < 2 days after the submission date", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
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
      applicationStatusFromString("IN_REVIEW"),
      "IN_REVIEW",
    );
  });

  test("converts invalid enum values to UNKNOWN", () => {
    expectApplicationStatusToBe(applicationStatusFromString(""), "UNKNOWN");
    expectApplicationStatusToBe(
      applicationStatusFromString("UNKNOWN_VALUE"),
      "UNKNOWN",
    );
  });
});

const expectApplicationStatusToBe = (
  actual: ApplicationStatus,
  expected: ApplicationStatus,
) => expect(actual).toBe(expected);

describe("applicationSourceFromString", () => {
  test("accepts valid enum values", () => {
    expectApplicationSourceToBe(
      applicationSourceFromString("GENERIC"),
      "GENERIC",
    );
    expectApplicationSourceToBe(
      applicationSourceFromString("BOULOGNE_SUR_MER"),
      "BOULOGNE_SUR_MER",
    );
  });

  test("converts invalid enum values to UNKNOWN", () => {
    expectApplicationSourceToBe(applicationSourceFromString(""), "UNKNOWN");
    expectApplicationSourceToBe(
      applicationSourceFromString("UNKNOWN_VALUE"),
      "UNKNOWN",
    );
  });
});

const expectApplicationSourceToBe = (
  actual: ApplicationSource,
  expected: ApplicationSource,
) => expect(actual).toBe(expected);

const expectDemandeImmersionDtoToBeValid = (
  validDemandeImmersionDto: ImmersionApplicationDto,
) => {
  expect(() =>
    immersionApplicationSchema.validateSync(validDemandeImmersionDto),
  ).not.toThrow();

  expect(
    immersionApplicationSchema.validateSync(validDemandeImmersionDto),
  ).toBeTruthy();
};

const expectDemandeImmersionDtoToBeInvalid = (
  demandeImmersionDto: ImmersionApplicationDto,
) =>
  expect(() =>
    immersionApplicationSchema.validateSync(demandeImmersionDto),
  ).toThrow();
