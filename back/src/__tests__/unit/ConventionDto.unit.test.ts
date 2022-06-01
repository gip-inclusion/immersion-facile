import {
  DATE_START,
  DATE_SUBMISSION,
  ConventionDtoBuilder,
} from "shared/src/convention/ConventionDtoBuilder";
import { ConventionEntityBuilder } from "../../_testBuilders/ConventionEntityBuilder";
import {
  addDays,
  splitCasesBetweenPassingAndFailing,
} from "../../_testBuilders/test.helpers";
import {
  ConventionStatus,
  ConventionDto,
  allConventionStatuses,
} from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";

describe("conventionDtoSchema", () => {
  it("accepts valid Convention", () => {
    /**/
    const convention = new ConventionDtoBuilder().build();
    expectConventionDtoToBeValid(convention);
  });

  it("ignores accents on emails", () => {
    const convention = new ConventionEntityBuilder()
      .withEmail("Jérôme_Truc@associés.fr")
      .build();

    expect(convention.toDto().email).toBe("Jerome_Truc@associes.fr");
  });

  it("rejects equal applicant and mentor emails", () => {
    const convention = new ConventionDtoBuilder()
      .withEmail("demandeur@mail.fr")
      .withMentorEmail("demandeur@mail.fr")
      .build();

    expectConventionDtoToBeInvalid(convention);
  });

  it("rejects when string with spaces are provided", () => {
    const convention = new ConventionDtoBuilder().withId("  ").build();

    expectConventionDtoToBeInvalid(convention);
  });

  it("rejects when phone is not a valid number", () => {
    const convention = new ConventionDtoBuilder().withPhone("wrong").build();

    expectConventionDtoToBeInvalid(convention);

    const convention2 = new ConventionDtoBuilder()
      .withPhone("0203stillWrong")
      .build();

    expectConventionDtoToBeInvalid(convention2);
  });

  it("rejects when mentorPhone is not a valid number", () => {
    const convention = new ConventionDtoBuilder()
      .withMentorPhone("wrong")
      .build();

    expectConventionDtoToBeInvalid(convention);
  });

  it("rejects misformatted submission dates", () => {
    const convention = new ConventionDtoBuilder()
      .withDateSubmission("not-a-date")
      .build();

    expectConventionDtoToBeInvalid(convention);
  });

  it("rejects misformatted start dates", () => {
    const convention = new ConventionDtoBuilder()
      .withDateStart("not-a-date")
      .build();

    expectConventionDtoToBeInvalid(convention);
  });

  it("rejects misformatted end dates", () => {
    const convention = new ConventionDtoBuilder()
      .withDateEnd("not-a-date")
      .build();

    expectConventionDtoToBeInvalid(convention);
  });

  it("rejects start dates that are after the end date", () => {
    const convention = new ConventionDtoBuilder()
      .withDateStart("2021-01-10")
      .withDateEnd("2021-01-03")
      .build();

    expectConventionDtoToBeInvalid(convention);
  });

  it("accept start dates that are tuesday if submiting on previous friday", () => {
    const convention = new ConventionDtoBuilder()
      .withDateSubmission("2021-10-15") // which is a friday
      .withDateStart("2021-10-19") // which is the following tuesday
      .withDateEnd("2021-10-30")
      .build();

    expectConventionDtoToBeValid(convention);
  });

  it("rejects end dates that are more than 28 days after the start date", () => {
    const convention = new ConventionDtoBuilder()
      .withDateStart(DATE_START)
      .withDateEnd(addDays(DATE_START, 29))
      .build();

    expectConventionDtoToBeInvalid(convention);
  });

  it("accepts end dates that are <= 28 days after the start date", () => {
    const convention = new ConventionDtoBuilder()
      .withDateStart(DATE_START)
      .withDateEnd(addDays(DATE_START, 28))
      .build();

    expectConventionDtoToBeValid(convention);
  });

  it("accepts start dates that are >= 2 days after the submission date", () => {
    const convention = new ConventionDtoBuilder()
      .withDateSubmission(DATE_SUBMISSION)
      .withDateStart(addDays(DATE_SUBMISSION, 2))
      .build();

    expectConventionDtoToBeValid(convention);
  });

  describe("status that are available without signatures", () => {
    const [allowWithoutSignature, failingWithoutSignature] =
      splitCasesBetweenPassingAndFailing<ConventionStatus>(
        allConventionStatuses,
        ["DRAFT", "READY_TO_SIGN", "PARTIALLY_SIGNED", "REJECTED", "CANCELLED"],
      );

    it.each(allowWithoutSignature.map((status) => ({ status })))(
      "WITHOUT signatures, a Convention CAN be $status",
      ({ status }) => {
        const convention = new ConventionDtoBuilder()
          .withStatus(status)
          .notSigned()
          .build();
        expectConventionDtoToBeValid(convention);
      },
    );

    it.each(failingWithoutSignature.map((status) => ({ status })))(
      "WITHOUT signatures, a Convention CANNOT be $status",
      ({ status }) => {
        const convention = new ConventionDtoBuilder()
          .withStatus(status)
          .notSigned()
          .build();
        expectConventionDtoToBeInvalid(convention);
      },
    );
  });
});

const expectConventionDtoToBeValid = (validConvention: ConventionDto) => {
  expect(() => conventionSchema.parse(validConvention)).not.toThrow();
  expect(conventionSchema.parse(validConvention)).toBeTruthy();
};

const expectConventionDtoToBeInvalid = (conventionDto: ConventionDto) =>
  expect(() => conventionSchema.parse(conventionDto)).toThrow();
