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
    test("prints complex schedules", () => {
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

    test("prints simple schedules", () => {
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
    test("converts complex schedule", () => {
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

    test("converts simple schedule", () => {
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
    test("accepts valid arrays", () => {
      expect(isArrayOfWeekdays([])).toEqual(true);
      expect(isArrayOfWeekdays(["lundi", "jeudi", "samedi"])).toEqual(true);
      expect(isArrayOfWeekdays(weekdays)).toEqual(true);
    });
    test("rejects invalid arrays", () => {
      expect(isArrayOfWeekdays(undefined)).toEqual(false);
      expect(isArrayOfWeekdays("hello world")).toEqual(false);
      expect(isArrayOfWeekdays(12345)).toEqual(false);
      expect(isArrayOfWeekdays([1, 2, 3])).toEqual(false);
      expect(isArrayOfWeekdays(["Lundi"])).toEqual(false);
      expect(isArrayOfWeekdays(["lundi", "MARDI"])).toEqual(false);
    });
  });
});
