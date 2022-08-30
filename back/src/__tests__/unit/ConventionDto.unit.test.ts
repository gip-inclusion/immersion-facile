import {
  allConventionStatuses,
  ConventionDto,
  ConventionStatus,
  immersionMaximumCalendarDays,
  immersionMaximumWorkingDays,
} from "shared/src/convention/convention.dto";
import {
  conventionSchema,
  conventionWithoutExternalIdSchema,
} from "shared/src/convention/convention.schema";
import {
  ConventionDtoBuilder,
  DATE_START,
} from "shared/src/convention/ConventionDtoBuilder";
import { DailyScheduleDto } from "shared/src/schedule/Schedule.dto";

import { ZodError } from "zod";
import {
  addDays,
  splitCasesBetweenPassingAndFailing,
} from "../../_testBuilders/test.helpers";

describe("conventionDtoSchema", () => {
  it("accepts valid Convention", () => {
    const convention = new ConventionDtoBuilder().build();
    expectConventionDtoToBeValid(convention);
  });

  it("ignores accents on emails", () => {
    const convention = new ConventionDtoBuilder()
      .withEmail("Jérôme_Truc@associés.fr")
      .build();
    const parsedConvention = conventionSchema.parse(convention);
    expect(parsedConvention.email).toBe("Jerome_Truc@associes.fr");
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

  describe("constraint on dates", () => {
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

    it("accept start dates that are tuesday if submitting on previous friday", () => {
      const convention = new ConventionDtoBuilder()
        .withDateSubmission("2021-10-15") // which is a friday
        .withDateStart("2021-10-19") // which is the following tuesday
        .withDateEnd("2021-10-30")
        .build();

      expectConventionDtoToBeValid(convention);
    });

    it(`rejects end dates that are more than ${immersionMaximumCalendarDays} calendar days after the start date`, () => {
      const convention = new ConventionDtoBuilder()
        .withDateStart(DATE_START)
        .withDateEnd(addDays(DATE_START, immersionMaximumCalendarDays + 1))
        .build();

      expectConventionDtoToBeInvalid(convention);
    });

    it(`accepts end dates that are < ${immersionMaximumCalendarDays} calendar days after the start date`, () => {
      const dateStart = DATE_START;
      const dateEnd = addDays(DATE_START, immersionMaximumCalendarDays - 1);
      const convention = new ConventionDtoBuilder()
        .withDateStart(dateStart)
        .withDateEnd(dateEnd)
        .build();

      expectConventionDtoToBeValid(convention);
    });

    it(`Schedules may have up to ${immersionMaximumWorkingDays} working days, should be valid`, () => {
      const convention = new ConventionDtoBuilder()
        .withDateStart(DATE_START)
        .withDateEnd(addDays(DATE_START, immersionMaximumWorkingDays))
        .withSchedule(() => ({
          isSimple: false,
          selectedIndex: 0,
          complexSchedule: scheduleWithXDaysArray(
            new Date(DATE_START),
            immersionMaximumWorkingDays,
          ),
        }))
        .build();

      expectConventionDtoToBeValid(convention);
    });

    it(`Schedules may have up to ${immersionMaximumWorkingDays} working days, adding one more day should fail`, () => {
      const conventionWithTooManyWorkingDays = new ConventionDtoBuilder()
        .withDateStart(DATE_START)
        .withDateEnd(addDays(DATE_START, immersionMaximumWorkingDays))
        .withSchedule(() => ({
          isSimple: false,
          selectedIndex: 0,
          complexSchedule: scheduleWithXDaysArray(
            new Date(DATE_START),
            immersionMaximumWorkingDays + 1,
          ),
        }))
        .build();

      expect(() => {
        conventionWithoutExternalIdSchema.parse(
          conventionWithTooManyWorkingDays,
        );
      }).toThrow(ZodError);
    });
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

const expectConventionDtoToBeValid = (validConvention: ConventionDto): void => {
  expect(() => conventionSchema.parse(validConvention)).not.toThrow();
  expect(conventionSchema.parse(validConvention)).toBeTruthy();
};

const expectConventionDtoToBeInvalid = (conventionDto: ConventionDto) =>
  expect(() => conventionSchema.parse(conventionDto)).toThrow();

const scheduleWithXDaysArray = (
  initialDate: Date,
  numberOfDays: number,
): DailyScheduleDto[] => {
  const daysArray: DailyScheduleDto[] = [];
  for (let i = 0; i < numberOfDays; i++) {
    daysArray.push(
      dailyScheduleWithFixedPeriods(addDays(initialDate.toISOString(), i)),
    );
  }

  return [...daysArray];
};

const dailyScheduleWithFixedPeriods = (
  dateIsoString: string,
): DailyScheduleDto => ({
  date: dateIsoString,
  timePeriods: [{ start: "08:00", end: "16:00" }],
});
