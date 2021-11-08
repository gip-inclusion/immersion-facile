import type { ZodError } from "zod";
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

    expectImmersionApplicationDtoToBeInvalid(demandeImmersion);
  });

  test("rejects when string with spaces are provided", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withId("  ")
      .build();

    expectImmersionApplicationDtoToBeInvalid(demandeImmersion);
  });

  test("rejects when phone is not a valid number", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withPhone("wrong")
      .build();

    expectImmersionApplicationDtoToBeInvalid(demandeImmersion);

    const demandeImmersion2 = new ImmersionApplicationDtoBuilder()
      .withPhone("0203stillWrong")
      .build();

    expectImmersionApplicationDtoToBeInvalid(demandeImmersion2);
  });

  test("rejects when mentorPhone is not a valid number", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withMentorPhone("wrong")
      .build();

    expectImmersionApplicationDtoToBeInvalid(demandeImmersion);
  });

  test("rejects misformatted submission dates", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withDateSubmission("not-a-date")
      .build();

    expectImmersionApplicationDtoToBeInvalid(demandeImmersion);
  });

  test("rejects misformatted start dates", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withDateStart("not-a-date")
      .build();

    expectImmersionApplicationDtoToBeInvalid(demandeImmersion);
  });

  test("rejects misformatted end dates", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withDateEnd("not-a-date")
      .build();

    expectImmersionApplicationDtoToBeInvalid(demandeImmersion);
  });

  test("rejects start dates that are after the end date", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withDateStart("2021-01-10")
      .withDateEnd("2021-01-03")
      .build();

    expectImmersionApplicationDtoToBeInvalid(demandeImmersion);
  });

  test("rejects start dates that are monday if submiting on previous friday", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withDateSubmission("2021-10-15") // which is a friday
      .withDateStart("2021-10-18") // which is the following monday
      .withDateEnd("2021-10-30")
      .build();

    expectImmersionApplicationDtoToBeInvalidWith(
      demandeImmersion,
      "Veuillez saisir une date de démarrage permettant au moins 24h pour sa validation par un conseiller",
    );
  });

  test("rejects start dates that are sunday if submiting on previous friday", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withDateSubmission("2021-10-15") // which is a friday
      .withDateStart("2021-10-17") // which is the following sunday
      .withDateEnd("2021-10-30")
      .build();

    expectImmersionApplicationDtoToBeInvalidWith(
      demandeImmersion,
      "Veuillez saisir une date de démarrage permettant au moins 24h pour sa validation par un conseiller",
    );
  });

  test("accept start dates that are tuesday if submiting on previous friday", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withDateSubmission("2021-10-15") // which is a friday
      .withDateStart("2021-10-19") // which is the following tuesday
      .withDateEnd("2021-10-30")
      .build();

    expectDemandeImmersionDtoToBeValid(demandeImmersion);
  });

  test("rejects end dates that are more than 28 days after the start date", () => {
    const demandeImmersion = new ImmersionApplicationDtoBuilder()
      .withDateStart(DATE_START)
      .withDateEnd(addDays(DATE_START, 29))
      .build();

    expectImmersionApplicationDtoToBeInvalid(demandeImmersion);
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

    expectImmersionApplicationDtoToBeInvalid(demandeImmersion);
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
    immersionApplicationSchema.parse(validDemandeImmersionDto),
  ).not.toThrow();

  expect(
    immersionApplicationSchema.parse(validDemandeImmersionDto),
  ).toBeTruthy();
};

const expectImmersionApplicationDtoToBeInvalid = (
  demandeImmersionDto: ImmersionApplicationDto,
) =>
  expect(() => immersionApplicationSchema.parse(demandeImmersionDto)).toThrow();

const expectImmersionApplicationDtoToBeInvalidWith = (
  demandeImmersionDto: ImmersionApplicationDto,
  expectedErrorMessage: string,
) => {
  expectImmersionApplicationDtoToBeInvalid(demandeImmersionDto);
  try {
    immersionApplicationSchema.parse(demandeImmersionDto);
  } catch (e) {
    const error = e as ZodError;
    error.issues.some(({ message }) =>
      expect(message).toBe(expectedErrorMessage),
    );
  }
};
