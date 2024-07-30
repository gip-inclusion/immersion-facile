import { ZodError } from "zod";
import { expectToEqual } from "../test.helpers";
import { DateRange } from "./assessment.dto";
import { withDateRangeSchema } from "./assessment.schema";

describe("assessment.schema", () => {
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

    expectToFailWithError(dateRange, [
      "La date de fin doit être après la date de début.",
    ]);
  });

  it("rejects invalid date range", () => {
    const dateRange: DateRange = {
      from: new Date("invalid"),
      to: new Date("invalid"),
    };

    expectToFailWithError(dateRange, ["Invalid date", "Invalid date"]);
  });
});

const expectToFailWithError = (
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
