import { ZodError } from "zod";
import { expectToEqual } from "../test.helpers";
import { type DateRange, withDateRangeSchema } from "../utils/date";
import type { AssessmentDto } from "./assessment.dto";
import { assessmentDtoSchema } from "./assessment.schema";

describe("Assessment schema date range", () => {
  it("accepts valid date range", () => {
    const dateRange: DateRange = {
      from: new Date("2024-07-01"),
      to: new Date("2024-07-20"),
    };

    const parsedDateRange = withDateRangeSchema.parse(dateRange);

    expect(parsedDateRange.from).toEqual(dateRange.from);
    expect(parsedDateRange.to).toEqual(dateRange.to);
  });

  it("rejects when date order is incorrect", () => {
    const dateRange: DateRange = {
      from: new Date("2024-07-20"),
      to: new Date("2024-07-01"),
    };

    expectDateRangeToFailWithError(dateRange, [
      "La date de fin doit être après la date de début.",
    ]);
  });

  it("rejects invalid date range", () => {
    const dateRange: DateRange = {
      from: new Date("invalid"),
      to: new Date("invalid"),
    };

    expectDateRangeToFailWithError(dateRange, ["Invalid date", "Invalid date"]);
  });
});

describe("Assessment schema", () => {
  it("accepts a minimal valid assessment", () => {
    const assessment: AssessmentDto = {
      status: "COMPLETED",
      endedWithAJob: false,
      conventionId: "my-convention-id",
      establishmentAdvices: "establishment advice",
      establishmentFeedback: "establishment feedback",
      beneficiaryAgreement: null,
      beneficiaryFeedback: null,
      signedAt: null,
    };
    const parsedAssessment = assessmentDtoSchema.parse(assessment);
    expectToEqual(assessment, parsedAssessment);
  });

  it("accepts an assessment of a partially completed immersion", () => {
    const assessment: AssessmentDto = {
      status: "PARTIALLY_COMPLETED",
      conventionId: "my-convention-id",
      endedWithAJob: true,
      typeOfContract: "CDI",
      contractStartDate: "2024-01-01",
      lastDayOfPresence: "2024-01-01",
      numberOfMissedHours: 10,
      establishmentAdvices: "establishment advices",
      establishmentFeedback: "establishment feedback",
      beneficiaryAgreement: null,
      beneficiaryFeedback: null,
      signedAt: null,
    };
    const parsedAssessment = assessmentDtoSchema.parse(assessment);
    expectToEqual(assessment, parsedAssessment);
  });

  it("accepts an assessment of a did not show immersion", () => {
    const assessment: AssessmentDto = {
      status: "DID_NOT_SHOW",
      conventionId: "my-convention-id",
      endedWithAJob: false,
      establishmentAdvices: "establishment advices",
      establishmentFeedback: "establishment feedback",
      beneficiaryAgreement: null,
      beneficiaryFeedback: null,
      signedAt: null,
    };
    const parsedAssessment = assessmentDtoSchema.parse(assessment);
    expectToEqual(assessment, parsedAssessment);
  });

  it("accepts an assessment with beneficiary signature", () => {
    const assessment: AssessmentDto = {
      status: "COMPLETED",
      conventionId: "my-convention-id",
      endedWithAJob: false,
      establishmentAdvices: "establishment advices",
      establishmentFeedback: "establishment feedback",
      beneficiaryAgreement: true,
      beneficiaryFeedback: "my beneficiary feedback",
      signedAt: "2024-01-01",
    };
    const parsedAssessment = assessmentDtoSchema.parse(assessment);
    expectToEqual(assessment, parsedAssessment);
  });

  it("accepts an assessment with beneficiary signature and no feedback", () => {
    const assessment: AssessmentDto = {
      status: "COMPLETED",
      conventionId: "my-convention-id",
      endedWithAJob: false,
      establishmentAdvices: "establishment advices",
      establishmentFeedback: "establishment feedback",
      beneficiaryAgreement: true,
      beneficiaryFeedback: null,
      signedAt: "2024-01-01",
    };
    const parsedAssessment = assessmentDtoSchema.parse(assessment);
    expectToEqual(assessment, parsedAssessment);
  });

  it("rejects an invalid assessment", () => {
    const assessment = {
      status: "PARTIALLY_COMPLETED",
      endedWithAJob: true,
      typeOfContract: "Alternance",
      contractStartDate: "",
      lastDayOfPresence: "",
      numberOfMissedHours: 0,
      conventionId: "1",
      establishmentAdvices: "my minimum establishment advices",
      establishmentFeedback: "my minimum establishment feedback",
    };
    expect(() => assessmentDtoSchema.parse(assessment)).toThrowError();
  });
});
const expectDateRangeToFailWithError = (
  dateRange: DateRange,
  issueMessages: string[],
) => {
  expect(() => withDateRangeSchema.parse(dateRange)).toThrow();
  try {
    withDateRangeSchema.parse(dateRange);
  } catch (error) {
    expect(error instanceof ZodError).toBeTruthy();
    if (error instanceof ZodError) {
      expectToEqual(
        error.issues.map((i) => i.message),
        issueMessages,
      );
    }
  }
};
