import { weekdays } from "shared/src/ScheduleSchema";
import {
  calculateTotalImmersionHoursBetweenDate,
  convertToFrenchNamedDays,
  isArrayOfWeekdays,
  prettyPrintSchedule,
} from "shared/src/ScheduleUtils";
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

  describe("calculateTotalImmersionHoursBetweenDate", () => {
    describe("with simple schedule", () => {
      const simpleScheduleClassic = new ScheduleDtoBuilder()
        .withSimpleSchedule({
          dayPeriods: [
            [0, 0],
            [2, 3],
          ],
          hours: [
            { start: "09:00", end: "12:30" },
            { start: "14:00", end: "18:00" },
          ],
        })
        .build();

      it("give hours time when immersion last only one day", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-04-04",
          dateEnd: "2022-04-04",
          schedule: simpleScheduleClassic,
        });
        expect(totalHours).toBe(7.5);
      });

      it("has no hours if the day is not one of the worked day", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-04-05",
          dateEnd: "2022-04-05",
          schedule: simpleScheduleClassic,
        });
        expect(totalHours).toBe(0);
      });

      it("calculate the some of days worked", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-04-04",
          dateEnd: "2022-04-07",
          schedule: simpleScheduleClassic,
        });
        expect(totalHours).toBe(22.5);
      });

      it("calculate the some of days worked even on several weeks", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-04-04",
          dateEnd: "2022-04-18",
          schedule: simpleScheduleClassic,
        });
        expect(totalHours).toBe(52.5);
      });
    });

    describe("with complex schedule", () => {
      const complexSchedule = new ScheduleDtoBuilder()
        .withComplexSchedule([
          [{ start: "08:00", end: "12:00" }],
          [],
          [],
          [
            { start: "06:00", end: "12:00" },
            { start: "18:00", end: "22:00" },
          ],
          [],
          [],
          [
            { start: "02:00", end: "06:00" },
            { start: "07:00", end: "10:00" },
            { start: "19:00", end: "21:00" },
          ],
        ])
        .build();

      it("give day hours when immersion last only one day", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-04-04",
          dateEnd: "2022-04-04",
          schedule: complexSchedule,
        });
        expect(totalHours).toBe(4);
      });

      it("has no hours if the day is not one of the worked day", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-04-05",
          dateEnd: "2022-04-05",
          schedule: complexSchedule,
        });
        expect(totalHours).toBe(0);
      });

      it("calculate the some of days worked", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-04-04",
          dateEnd: "2022-04-10",
          schedule: complexSchedule,
        });
        expect(totalHours).toBe(23);
      });

      it("calculate the some of days worked even on several weeks", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-04-04",
          dateEnd: "2022-04-18",
          schedule: complexSchedule,
        });
        expect(totalHours).toBe(50);
      });
    });
    describe("with complex schedule that return 0 on prod from Excel sample but OK on unit test", () => {
      const complexSchedule = new ScheduleDtoBuilder()
        .withComplexSchedule([
          [
            { end: "12:30", start: "08:00" },
            { end: "16:30", start: "14:00" },
          ],
          [
            { end: "12:30", start: "08:00" },
            { end: "16:30", start: "14:00" },
          ],
          [
            { end: "12:30", start: "08:00" },
            { end: "16:30", start: "14:00" },
          ],
          [
            { end: "12:30", start: "08:00" },
            { end: "16:30", start: "14:00" },
          ],
          [
            { end: "12:30", start: "08:00" },
            { end: "16:30", start: "14:00" },
          ],
          [],
          [],
        ])
        .build();

      it("has 140 hours with good date format.", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022/04/11",
          dateEnd: "2022/05/08",
          schedule: complexSchedule,
        });
        expect(totalHours).toBe(140);
      });
    });
    describe("with complex schedule that return 0 on prod from PG sample and 0 on unit test", () => {
      const complexSchedule = new ScheduleDtoBuilder()
        .withComplexSchedule([
          [
            { end: "12:30", start: "08:00" },
            { end: "16:30", start: "14:00" },
          ],
          [
            { end: "12:30", start: "08:00" },
            { end: "16:30", start: "14:00" },
          ],
          [
            { end: "12:30", start: "08:00" },
            { end: "16:30", start: "14:00" },
          ],
          [
            { end: "12:30", start: "08:00" },
            { end: "16:30", start: "14:00" },
          ],
          [
            { end: "12:30", start: "08:00" },
            { end: "16:30", start: "14:00" },
          ],
          [],
          [],
        ])
        .build();

      it("has no hours if the start and end dates are in french format", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "11/04/2022",
          dateEnd: "08/05/2022",
          schedule: complexSchedule,
        });
        expect(totalHours).toBe(0);
      });
    });
  });
});
