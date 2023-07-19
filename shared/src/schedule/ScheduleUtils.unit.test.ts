import { expectToEqual } from "../test.helpers";
import { DayPeriodsDto, ScheduleDto } from "./Schedule.dto";
import { dateIsoStringSchema, scheduleSchema } from "./Schedule.schema";
import { ScheduleDtoBuilder } from "./ScheduleDtoBuilder";
import {
  calculateNumberOfWorkedDays,
  calculateScheduleTotalDurationInDays,
  calculateTotalImmersionHoursFromComplexSchedule,
  calculateWeeklyHoursFromSchedule,
  dayPeriodsFromComplexSchedule,
  isSundayInSchedule,
  makeDailySchedule,
  prettyPrintSchedule,
} from "./ScheduleUtils";

describe("ScheduleUtils", () => {
  describe("complexScheduleFromRegularSchedule", () => {
    const timePeriods = [{ start: "08:00", end: "10:00" }];
    it("with empty regular schedule and same days", () => {
      const scheduleFromEmptyComplexSchedule = new ScheduleDtoBuilder()
        .withDateInterval({
          start: new Date("2022-06-25"),
          end: new Date("2022-06-26"),
        })
        .withRegularSchedule({
          dayPeriods: [[5, 6]],
          timePeriods,
        })
        .build();

      expect(scheduleFromEmptyComplexSchedule.complexSchedule).toEqual(
        new ScheduleDtoBuilder()
          .withComplexSchedule([
            { date: new Date("2022-06-25").toISOString(), timePeriods },
            { date: new Date("2022-06-26").toISOString(), timePeriods },
          ])
          .build().complexSchedule,
      );
    });
    describe("with updated regular schedule dayPeriods", () => {
      it("initial dayPeriods", () => {
        const scheduleFromEmptyComplexSchedule = new ScheduleDtoBuilder()
          .withDateInterval({
            start: new Date("2022-06-22"),
            end: new Date("2022-07-03"),
          })
          .withRegularSchedule({
            dayPeriods: [[0, 1]],
            timePeriods,
          })
          .build();
        expect(scheduleFromEmptyComplexSchedule.complexSchedule).toEqual(
          new ScheduleDtoBuilder()
            .withComplexSchedule([
              { date: new Date("2022-06-27").toISOString(), timePeriods },
              { date: new Date("2022-06-28").toISOString(), timePeriods },
            ])
            .build().complexSchedule,
        );
      });
      it("updated dayPeriods", () => {
        const scheduleFromEmptyComplexSchedule = new ScheduleDtoBuilder()
          .withDateInterval({
            start: new Date("2022-06-22"),
            end: new Date("2022-07-03"),
          })
          .withRegularSchedule({
            dayPeriods: [[2, 3]],
            timePeriods,
          })
          .build();
        expect(scheduleFromEmptyComplexSchedule.complexSchedule).toEqual(
          new ScheduleDtoBuilder()
            .withComplexSchedule([
              { date: new Date("2022-06-22").toISOString(), timePeriods },
              { date: new Date("2022-06-23").toISOString(), timePeriods },
              { date: new Date("2022-06-29").toISOString(), timePeriods },
              { date: new Date("2022-06-30").toISOString(), timePeriods },
            ])
            .build().complexSchedule,
        );
      });
    });
  });
  describe("prettyPrintSchedule", () => {
    it("prints complex schedules", () => {
      expect(
        prettyPrintSchedule(
          new ScheduleDtoBuilder().withEmptyRegularSchedule().build(),
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
      expect(prettyPrintSchedule(complexSchedule()).split("\n")).toEqual([
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
          new ScheduleDtoBuilder().withEmptyRegularSchedule().build(),
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
      expect(prettyPrintSchedule(regularSchedule()).split("\n")).toEqual([
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
    it("prints schedules with schedule that have no timeperiod", () => {
      expect(
        prettyPrintSchedule({
          totalHours: 12,
          workedDays: 4,
          isSimple: false,
          selectedIndex: 6,
          complexSchedule: [
            {
              date: "2022-07-18T00:00:00.000Z",
              timePeriods: [
                {
                  start: "14:00",
                  end: "17:00",
                },
              ],
            },
            {
              date: "2022-07-19T00:00:00.000Z",
              timePeriods: [],
            },
            {
              date: "2022-07-20T00:00:00.000Z",
              timePeriods: [
                {
                  start: "10:00",
                  end: "12:00",
                },
                {
                  start: "14:00",
                  end: "16:00",
                },
              ],
            },
            {
              date: "2022-07-21T00:00:00.000Z",
              timePeriods: [
                {
                  start: "14:00",
                  end: "16:00",
                },
              ],
            },
            {
              date: "2022-07-22T00:00:00.000Z",
              timePeriods: [],
            },
            {
              date: "2022-07-23T00:00:00.000Z",
              timePeriods: [
                {
                  start: "09:00",
                  end: "12:00",
                },
              ],
            },
            {
              date: "2022-07-24T00:00:00.000Z",
              timePeriods: [],
            },
          ],
        }).split("\n"),
      ).toEqual([
        "Heures de travail hebdomadaires : 12",
        "lundi : 14:00-17:00",
        "mardi : libre",
        "mercredi : 10:00-12:00, 14:00-16:00",
        "jeudi : 14:00-16:00",
        "vendredi : libre",
        "samedi : 09:00-12:00",
        "dimanche : libre",
      ]);
    });
  });

  describe("calculateTotalDurationInDays", () => {
    it("calculates correctly the total duration in days for a complex schedule", () => {
      const expectedForShortSchedule = 6;
      const expectedForLongSchedule = 16;
      const exampleShortComplexSchedule: ScheduleDto = complexSchedule();
      const exampleLongComplexSchedule: ScheduleDto = longComplexSchedule();
      expect(
        calculateScheduleTotalDurationInDays(
          exampleShortComplexSchedule.complexSchedule,
        ),
      ).toEqual(expectedForShortSchedule);
      expect(
        calculateScheduleTotalDurationInDays(
          exampleLongComplexSchedule.complexSchedule,
        ),
      ).toEqual(expectedForLongSchedule);
    });

    it("calculates correctly the total duration in days for a regular schedule", () => {
      const expectedForShortSchedule = 6;
      const expectedForLongSchedule = 11;
      const exampleShortRegularSchedule: ScheduleDto = regularSchedule();
      const exampleLongRegularSchedule: ScheduleDto = longRegularSchedule();
      expect(
        calculateScheduleTotalDurationInDays(
          exampleShortRegularSchedule.complexSchedule,
        ),
      ).toEqual(expectedForShortSchedule);
      expect(
        calculateScheduleTotalDurationInDays(
          exampleLongRegularSchedule.complexSchedule,
        ),
      ).toEqual(expectedForLongSchedule);
    });
  });
  describe("calculateWeeklyHoursFromSchedule", () => {
    it("calculates correctly the total number of hours from a complex schedule", () => {
      const schedule = new ScheduleDtoBuilder()
        .withDateInterval({
          start: new Date("2022-06-06"),
          end: new Date("2022-06-10"),
        })
        .withRegularSchedule({
          dayPeriods: [
            [0, 0],
            [2, 3],
          ],
          timePeriods: [
            { start: "09:00", end: "12:30" },
            { start: "14:00", end: "18:00" },
          ],
        })
        .build();

      const weeklyHours = calculateWeeklyHoursFromSchedule(schedule);
      expectToEqual(weeklyHours, [22.5]);
    });
  });
  describe("CalculateTotalImmersionHoursFromComplexSchedule", () => {
    it("calculates correctly the total number of hours from a complex schedule", () => {
      const schedule = new ScheduleDtoBuilder()
        .withDateInterval({
          start: new Date("2022-06-06"),
          end: new Date("2022-06-10"),
        })
        .withRegularSchedule({
          dayPeriods: [
            [0, 0],
            [2, 3],
          ],
          timePeriods: [
            { start: "09:00", end: "12:30" },
            { start: "14:00", end: "18:00" },
          ],
        })
        .build();

      expectToEqual(
        calculateTotalImmersionHoursFromComplexSchedule(
          schedule.complexSchedule,
        ),
        22.5,
      );
    });
  });

  describe("dayPeriodsFromComplexSchedule", () => {
    const timePeriods = [
      { start: "09:00", end: "12:30" },
      { start: "14:00", end: "18:00" },
    ];
    const dateInterval = {
      start: new Date("2022-06-29"),
      end: new Date("2022-07-21"),
    };
    describe("with no schedule", () => {
      it("empty day period without simple schedule build", () => {
        const schedule = new ScheduleDtoBuilder()
          .withDateInterval(dateInterval)
          .build();
        expect(dayPeriodsFromComplexSchedule(schedule.complexSchedule)).toEqual(
          [],
        );
      });
      it(`dayperiods '${JSON.stringify([])}'`, () => {
        const schedule = new ScheduleDtoBuilder()
          .withDateInterval(dateInterval)
          .withRegularSchedule({ dayPeriods: [], timePeriods })
          .build();
        expect(dayPeriodsFromComplexSchedule(schedule.complexSchedule)).toEqual(
          [],
        );
      });
      it("should not validate schema without any timeperiod", () => {
        const emptySchedule = new ScheduleDtoBuilder()
          .withRegularSchedule({
            dayPeriods: [],
            timePeriods: [],
          })
          .build();

        expect(() => scheduleSchema.parse(emptySchedule)).toThrow();
      });
      describe("check matching totalHours and worked days", () => {
        const scheduleBuilder = new ScheduleDtoBuilder()
          .withDateInterval({
            start: new Date("2022-06-06"),
            end: new Date("2022-06-10"),
          })
          .withRegularSchedule({
            dayPeriods: [
              [0, 0],
              [2, 3],
            ],
            timePeriods: [
              { start: "09:00", end: "12:30" },
              { start: "14:00", end: "18:00" },
            ],
          });

        it("does not validate schema if totalHours do not match calculated one", () => {
          const schedule = scheduleBuilder.withTotalHours(3).build();
          expect(() => scheduleSchema.parse(schedule)).toThrow();
        });

        it("validates schema if totalHours matches calculated one", () => {
          const schedule = scheduleBuilder.withTotalHours(22.5).build();
          const validated = scheduleSchema.parse(schedule);
          expectToEqual(validated.totalHours, 22.5);
        });

        it("does not validate schema if workedDays do not match calculated one", () => {
          const schedule = scheduleBuilder.withWorkedDays(1).build();
          expect(() => scheduleSchema.parse(schedule)).toThrow();
        });

        it("validates schema if workedDays matches calculated one", () => {
          const schedule = scheduleBuilder.withWorkedDays(3).build();
          const validated = scheduleSchema.parse(schedule);
          expectToEqual(validated.workedDays, 3);
        });
      });
    });

    describe("with one day period of one day", () => {
      const dayPeriodsScenarios: DayPeriodsDto[] = [
        [[0, 0]],
        [[1, 1]],
        [[2, 2]],
        [[3, 3]],
        [[4, 4]],
        [[5, 5]],
        [[6, 6]],
      ];
      dayPeriodsScenarios.forEach((dayPeriods) =>
        it(`dayperiods '${JSON.stringify(dayPeriods)}'`, () => {
          const schedule = new ScheduleDtoBuilder()
            .withDateInterval(dateInterval)
            .withRegularSchedule({
              dayPeriods,
              timePeriods,
            })
            .build();
          expect(
            dayPeriodsFromComplexSchedule(schedule.complexSchedule),
          ).toEqual(dayPeriods);
        }),
      );
    });

    describe("with one day period of multiple days", () => {
      const dayPeriodsScenarios: DayPeriodsDto[] = [
        [[0, 1]],
        [[2, 3]],
        [[2, 4]],
        [[1, 6]],
        [[3, 6]],
        [[0, 4]],
        [[5, 6]],
      ];
      dayPeriodsScenarios.forEach((dayPeriods) =>
        it(`dayperiods '${JSON.stringify(dayPeriods)}'`, () => {
          const schedule = new ScheduleDtoBuilder()
            .withDateInterval(dateInterval)
            .withRegularSchedule({
              dayPeriods,
              timePeriods,
            })
            .build();
          expect(
            dayPeriodsFromComplexSchedule(schedule.complexSchedule),
          ).toEqual(dayPeriods);
        }),
      );
    });
    describe("with multiple day periods of multiple days", () => {
      const dayPeriodsScenarios: DayPeriodsDto[] = [
        [
          [0, 1],
          [3, 4],
        ],
        [
          [0, 4],
          [6, 6],
        ],
        [
          [1, 2],
          [4, 5],
        ],
        [
          [0, 0],
          [2, 4],
          [6, 6],
        ],
      ];
      dayPeriodsScenarios.forEach((dayPeriods) =>
        it(`dayperiods '${JSON.stringify(dayPeriods)}'`, () => {
          const schedule = new ScheduleDtoBuilder()
            .withDateInterval(dateInterval)
            .withRegularSchedule({
              dayPeriods,
              timePeriods,
            })
            .build();
          expect(
            dayPeriodsFromComplexSchedule(schedule.complexSchedule),
          ).toEqual(dayPeriods);
        }),
      );
    });
  });

  describe("dateIsoStringSchema schema", () => {
    it.each(["2022-07-05", new Date("2022-07-05")])(
      "parse '%s' is valid",
      (date) => {
        expect(dateIsoStringSchema.parse(date)).toEqual(
          new Date(date).toISOString(),
        );
      },
    );
    it.each(["Not a date", "31-07-2022"])("parse '%s' is invalid", (date) => {
      expect(() => dateIsoStringSchema.parse(date)).toThrow(
        "Invalid time value",
      );
    });
  });
  describe("french hour changes (changement d'heure)", () => {
    it("schedule with 26th March", () => {
      const interval = {
        start: new Date("2023-03-21"),
        end: new Date("2023-03-30"),
      };
      const schedule = new ScheduleDtoBuilder()
        .withDateInterval(interval)
        .withRegularSchedule({
          dayPeriods: [[6, 6]],
          timePeriods: [{ start: "08:00", end: "12:00" }],
        })
        .build();
      expectToEqual(schedule.complexSchedule, [
        {
          date: "2023-03-26T00:00:00.000Z",
          timePeriods: [
            {
              start: "08:00",
              end: "12:00",
            },
          ],
        },
      ]);
      expectToEqual(
        calculateTotalImmersionHoursFromComplexSchedule(
          schedule.complexSchedule,
        ),
        4,
      );
      expectToEqual(calculateNumberOfWorkedDays(schedule.complexSchedule), 1);
    });
  });
  describe("isSundayInSchedule", () => {
    it("return false if schedule does not contain sunday", () => {
      const complexSchedule = makeDailySchedule(new Date("2023-07-18"), [
        { start: "01:00", end: "02:00" },
      ]);

      expect(isSundayInSchedule([complexSchedule])).toBe(false);
    });

    it("return true if schedule contains sunday", () => {
      const complexSchedule = makeDailySchedule(new Date("2023-07-23"), [
        { start: "01:00", end: "02:00" },
      ]);

      expect(isSundayInSchedule([complexSchedule])).toBe(true);
    });
  });
});

const complexSchedule = () =>
  new ScheduleDtoBuilder()
    .withComplexSchedule([
      makeDailySchedule(new Date("2022-06-13"), [
        { start: "01:00", end: "02:00" },
      ]),
      makeDailySchedule(new Date("2022-06-14"), []),
      makeDailySchedule(new Date("2022-06-15"), []),
      makeDailySchedule(new Date("2022-06-16"), [
        { start: "01:00", end: "02:00" },
        { start: "03:00", end: "04:00" },
      ]),
      makeDailySchedule(new Date("2022-06-17"), []),
      makeDailySchedule(new Date("2022-06-18"), []),
      makeDailySchedule(new Date("2022-06-19"), [
        { start: "01:00", end: "02:00" },
        { start: "03:00", end: "04:00" },
        { start: "05:00", end: "06:00" },
      ]),
    ])
    .build();

const longComplexSchedule = () =>
  new ScheduleDtoBuilder()
    .withComplexSchedule([
      makeDailySchedule(new Date("2023-06-13"), [
        { start: "01:00", end: "02:00" },
      ]),
      makeDailySchedule(new Date("2023-06-14"), []),
      makeDailySchedule(new Date("2023-06-15"), []),
      makeDailySchedule(new Date("2023-06-16"), [
        { start: "01:00", end: "02:00" },
        { start: "03:00", end: "04:00" },
      ]),
      makeDailySchedule(new Date("2023-06-17"), []),
      makeDailySchedule(new Date("2023-06-27"), []),
      makeDailySchedule(new Date("2023-06-29"), [
        { start: "01:00", end: "02:00" },
        { start: "03:00", end: "04:00" },
        { start: "05:00", end: "06:00" },
      ]),
    ])
    .build();

const regularSchedule = () =>
  new ScheduleDtoBuilder()
    .withRegularSchedule({
      dayPeriods: [
        [0, 0],
        [2, 3],
        [6, 6],
      ],
      timePeriods: [
        { start: "01:00", end: "02:00" },
        { start: "03:00", end: "04:00" },
      ],
    })
    .build();

const longRegularSchedule = () =>
  new ScheduleDtoBuilder()
    .withDateInterval({
      start: new Date("2022-06-15"),
      end: new Date("2022-06-26"),
    })
    .withRegularSchedule({
      dayPeriods: [
        [0, 0],
        [2, 3],
        [6, 6],
      ],
      timePeriods: [
        { start: "01:00", end: "02:00" },
        { start: "03:00", end: "04:00" },
      ],
    })
    .build();
