import { toDateString } from "./date";

describe("Date utils tests", () => {
  it("should format a valid date", () => {
    const date = new Date("2021-01-01");
    expect(toDateString(date)).toBe("2021-01-01");
  });
  it("can't format an empty string", () => {
    const date = new Date("");
    expect(() => toDateString(date)).toThrow("Invalid time value");
  });
});
