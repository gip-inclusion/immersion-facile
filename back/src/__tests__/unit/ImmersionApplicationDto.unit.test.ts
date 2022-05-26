import {
  DATE_START,
  DATE_SUBMISSION,
  ImmersionApplicationDtoBuilder,
} from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { ImmersionApplicationEntityBuilder } from "../../_testBuilders/ImmersionApplicationEntityBuilder";
import { addDays } from "../../_testBuilders/test.helpers";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
  validApplicationStatus,
} from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { immersionApplicationSchema } from "shared/src/ImmersionApplication/immersionApplication.schema";
import { splitCasesBetweenPassingAndFailing } from "./useCases/UpdateImmersionApplicationStatus.testHelpers";

describe("immersionApplicationDtoSchema", () => {
  it("accepts valid immersionApplication", () => {
    const immersionApplication = new ImmersionApplicationDtoBuilder().build();
    expectImmersionApplicationDtoToBeValid(immersionApplication);
  });

  it("ignores accents and case on emails", () => {
    const immersionApplication = new ImmersionApplicationEntityBuilder()
      .withEmail("Jérôme_Truc@associés.fr")
      .build();

    expect(immersionApplication.toDto().email).toBe("jerome_truc@associes.fr");
  });

  it("rejects equal applicant and mentor emails", () => {
    const immersionApplication = new ImmersionApplicationDtoBuilder()
      .withEmail("demandeur@mail.fr")
      .withMentorEmail("demandeur@mail.fr")
      .build();

    expectImmersionApplicationDtoToBeInvalid(immersionApplication);
  });

  it("rejects when string with spaces are provided", () => {
    const immersionApplication = new ImmersionApplicationDtoBuilder()
      .withId("  ")
      .build();

    expectImmersionApplicationDtoToBeInvalid(immersionApplication);
  });

  it("rejects when phone is not a valid number", () => {
    const immersionApplication = new ImmersionApplicationDtoBuilder()
      .withPhone("wrong")
      .build();

    expectImmersionApplicationDtoToBeInvalid(immersionApplication);

    const immersionApplication2 = new ImmersionApplicationDtoBuilder()
      .withPhone("0203stillWrong")
      .build();

    expectImmersionApplicationDtoToBeInvalid(immersionApplication2);
  });

  it("rejects when mentorPhone is not a valid number", () => {
    const immersionApplication = new ImmersionApplicationDtoBuilder()
      .withMentorPhone("wrong")
      .build();

    expectImmersionApplicationDtoToBeInvalid(immersionApplication);
  });

  it("rejects misformatted submission dates", () => {
    const immersionApplication = new ImmersionApplicationDtoBuilder()
      .withDateSubmission("not-a-date")
      .build();

    expectImmersionApplicationDtoToBeInvalid(immersionApplication);
  });

  it("rejects misformatted start dates", () => {
    const immersionApplication = new ImmersionApplicationDtoBuilder()
      .withDateStart("not-a-date")
      .build();

    expectImmersionApplicationDtoToBeInvalid(immersionApplication);
  });

  it("rejects misformatted end dates", () => {
    const immersionApplication = new ImmersionApplicationDtoBuilder()
      .withDateEnd("not-a-date")
      .build();

    expectImmersionApplicationDtoToBeInvalid(immersionApplication);
  });

  it("rejects start dates that are after the end date", () => {
    const immersionApplication = new ImmersionApplicationDtoBuilder()
      .withDateStart("2021-01-10")
      .withDateEnd("2021-01-03")
      .build();

    expectImmersionApplicationDtoToBeInvalid(immersionApplication);
  });

  it("accept start dates that are tuesday if submiting on previous friday", () => {
    const immersionApplication = new ImmersionApplicationDtoBuilder()
      .withDateSubmission("2021-10-15") // which is a friday
      .withDateStart("2021-10-19") // which is the following tuesday
      .withDateEnd("2021-10-30")
      .build();

    expectImmersionApplicationDtoToBeValid(immersionApplication);
  });

  it("rejects end dates that are more than 28 days after the start date", () => {
    const immersionApplication = new ImmersionApplicationDtoBuilder()
      .withDateStart(DATE_START)
      .withDateEnd(addDays(DATE_START, 29))
      .build();

    expectImmersionApplicationDtoToBeInvalid(immersionApplication);
  });

  it("accepts end dates that are <= 28 days after the start date", () => {
    const immersionApplication = new ImmersionApplicationDtoBuilder()
      .withDateStart(DATE_START)
      .withDateEnd(addDays(DATE_START, 28))
      .build();

    expectImmersionApplicationDtoToBeValid(immersionApplication);
  });

  it("accepts start dates that are >= 2 days after the submission date", () => {
    const immersionApplication = new ImmersionApplicationDtoBuilder()
      .withDateSubmission(DATE_SUBMISSION)
      .withDateStart(addDays(DATE_SUBMISSION, 2))
      .build();

    expectImmersionApplicationDtoToBeValid(immersionApplication);
  });

  describe("status that are available without signatures", () => {
    const [allowWithoutSignature, failingWithoutSignature] =
      splitCasesBetweenPassingAndFailing<ApplicationStatus>(
        validApplicationStatus,
        ["DRAFT", "READY_TO_SIGN", "PARTIALLY_SIGNED", "REJECTED", "CANCELLED"],
      );

    it.each(allowWithoutSignature.map((status) => ({ status })))(
      "WITHOUT signatures, a convention CAN be $status",
      ({ status }) => {
        const immersionApplication = new ImmersionApplicationDtoBuilder()
          .withStatus(status)
          .notSigned()
          .build();
        expectImmersionApplicationDtoToBeValid(immersionApplication);
      },
    );

    it.each(failingWithoutSignature.map((status) => ({ status })))(
      "WITHOUT signatures, a convention CANNOT be $status",
      ({ status }) => {
        const immersionApplication = new ImmersionApplicationDtoBuilder()
          .withStatus(status)
          .notSigned()
          .build();
        expectImmersionApplicationDtoToBeInvalid(immersionApplication);
      },
    );
  });
});

const expectImmersionApplicationDtoToBeValid = (
  validImmersionApplicationDto: ImmersionApplicationDto,
) => {
  expect(() =>
    immersionApplicationSchema.parse(validImmersionApplicationDto),
  ).not.toThrow();

  expect(
    immersionApplicationSchema.parse(validImmersionApplicationDto),
  ).toBeTruthy();
};

const expectImmersionApplicationDtoToBeInvalid = (
  immersionApplicationDto: ImmersionApplicationDto,
) =>
  expect(() =>
    immersionApplicationSchema.parse(immersionApplicationDto),
  ).toThrow();
