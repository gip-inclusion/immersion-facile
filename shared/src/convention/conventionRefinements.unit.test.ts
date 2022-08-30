import { immersionMaximumCalendarDays } from "./convention.dto";
import { underMaxCalendarDuration } from "./conventionRefinements";

describe("conventionRefinements underMaxCalendarDuration", () => {
  it.each([
    ["2022-09-26", "2022-10-22", true],
    ["2022-09-01", "2022-09-30", true],
    ["2022-09-01", "2022-10-01", false],
    ["2022-09-01", "2022-10-05", false],
  ])(
    `With dateStart: %s and dateEnd %s should return %s as the number of days between start and end is inferior or equal to ${immersionMaximumCalendarDays}`,
    (dateStart: string, dateEnd: string, expected: boolean) => {
      expect(underMaxCalendarDuration({ dateStart, dateEnd })).toBe(expected);
    },
  );
});
