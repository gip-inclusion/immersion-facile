import { weekdays } from "../../shared/ScheduleSchema";
import {
  convertToFrenchNamedDays,
  isArrayOfWeekdays,
  prettyPrintSchedule,
} from "../../shared/ScheduleUtils";
import { ScheduleDtoBuilder } from "../../_testBuilders/ScheduleDtoBuilder";

const complexSchedule = new ScheduleDtoBuilder()
  .withComplexSchedule([
    [{ start: "01:00", end: "02:00" }],
    [],
    [],
    [
      { start: "01:00", end: "02:00" },
      { start: "03:00", end: "04:00" },
    ],
    [],
    [],
    [
      { start: "01:00", end: "02:00" },
      { start: "03:00", end: "04:00" },
      { start: "05:00", end: "06:00" },
    ],
  ])
  .build();

const simpleSchedule = new ScheduleDtoBuilder()
  .withSimpleSchedule({
    dayPeriods: [
      [0, 0],
      [2, 3],
      [6, 6],
    ],
    hours: [
      { start: "01:00", end: "02:00" },
      { start: "03:00", end: "04:00" },
    ],
  })
  .build();

describe("ScheduleUtils", () => {
  describe("prettyPrintSchedule", () => {
    it("prints complex schedules", () => {
      expect(
        prettyPrintSchedule(
          new ScheduleDtoBuilder().withEmptySimpleSchedule().build(),
        ).split("\n"),
      ).toEqual([
        "Heures de travail hebdomadaires : 0",
        "lundi : libre",
        "mardi : libre",
        "mercredi : libre",
        "jeudi : libre",
        "vendredi : libre",
        "samedi : libre",
        "dimanche : libre",
      ]);
      expect(prettyPrintSchedule(complexSchedule).split("\n")).toEqual([
        "Heures de travail hebdomadaires : 6",
        "lundi : 01:00-02:00",
        "mardi : libre",
        "mercredi : libre",
        "jeudi : 01:00-02:00, 03:00-04:00",
        "vendredi : libre",
        "samedi : libre",
        "dimanche : 01:00-02:00, 03:00-04:00,",
        "05:00-06:00",
      ]);
    });

    it("prints simple schedules", () => {
      expect(
        prettyPrintSchedule(
          new ScheduleDtoBuilder().withEmptySimpleSchedule().build(),
        ).split("\n"),
      ).toEqual([
        "Heures de travail hebdomadaires : 0",
        "lundi : libre",
        "mardi : libre",
        "mercredi : libre",
        "jeudi : libre",
        "vendredi : libre",
        "samedi : libre",
        "dimanche : libre",
      ]);
      expect(prettyPrintSchedule(simpleSchedule).split("\n")).toEqual([
        "Heures de travail hebdomadaires : 8",
        "lundi : 01:00-02:00, 03:00-04:00",
        "mardi : libre",
        "mercredi : 01:00-02:00, 03:00-04:00",
        "jeudi : 01:00-02:00, 03:00-04:00",
        "vendredi : libre",
        "samedi : libre",
        "dimanche : 01:00-02:00, 03:00-04:00",
      ]);
    });
  });

  describe("convertToFrenchNamedDays", () => {
    it("converts complex schedule", () => {
      expect(
        convertToFrenchNamedDays(
          new ScheduleDtoBuilder().withEmptyComplexSchedule().build(),
        ),
      ).toEqual([]);
      expect(convertToFrenchNamedDays(complexSchedule)).toEqual([
        "lundi",
        "jeudi",
        "dimanche",
      ]);
    });

    it("converts simple schedule", () => {
      expect(
        convertToFrenchNamedDays(
          new ScheduleDtoBuilder().withEmptySimpleSchedule().build(),
        ),
      ).toEqual([]);
      expect(convertToFrenchNamedDays(simpleSchedule)).toEqual([
        "lundi",
        "mercredi",
        "jeudi",
        "dimanche",
      ]);
    });
  });

  describe("isArrayOfWeekdays", () => {
    it("accepts valid arrays", () => {
      expect(isArrayOfWeekdays([])).toBe(true);
      expect(isArrayOfWeekdays(["lundi", "jeudi", "samedi"])).toBe(true);
      expect(isArrayOfWeekdays(weekdays)).toBe(true);
    });
    it("rejects invalid arrays", () => {
      expect(isArrayOfWeekdays(undefined)).toBe(false);
      expect(isArrayOfWeekdays("hello world")).toBe(false);
      expect(isArrayOfWeekdays(12345)).toBe(false);
      expect(isArrayOfWeekdays([1, 2, 3])).toBe(false);
      expect(isArrayOfWeekdays(["Lundi"])).toBe(false);
      expect(isArrayOfWeekdays(["lundi", "MARDI"])).toBe(false);
    });
  });
});
