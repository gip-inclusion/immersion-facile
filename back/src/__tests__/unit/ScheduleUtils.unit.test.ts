import { DayPeriodsDto, weekdays } from "shared";
import { isoStringSchema, scheduleSchema } from "shared";
import { ScheduleDtoBuilder } from "shared";
import {
  calculateTotalImmersionHoursBetweenDate,
  convertToFrenchNamedDays,
  dayPeriodsFromComplexSchedule,
  isArrayOfWeekdays,
  makeDailySchedule,
  prettyPrintSchedule,
} from "shared";

describe("ScheduleUtils", () => {
  describe("complexScheduleFromRegularSchedule", () => {
    const timePeriods = [{ start: "08:00", end: "10:00" }];
    it("with empty regular schedule and same days", () => {
      const scheduleFromEmptyComplexSchedule = new ScheduleDtoBuilder()
        .withEmptyComplexSchedule({
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
          .withEmptyComplexSchedule({
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
          .withEmptyComplexSchedule({
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
          isSimple: false,
          selectedIndex: 6,
          complexSchedule: [
            {
              date: "2022-07-18T00:00:00.000Z",
              timePeriods: [
                {
                  end: "17:00",
                  start: "14:00",
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
                  end: "12:00",
                  start: "10:00",
                },
                {
                  end: "16:00",
                  start: "14:00",
                },
              ],
            },
            {
              date: "2022-07-21T00:00:00.000Z",
              timePeriods: [
                {
                  end: "16:00",
                  start: "14:00",
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
                  end: "12:00",
                  start: "09:00",
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

  describe("convertToFrenchNamedDays", () => {
    it("converts complex schedule", () => {
      expect(
        convertToFrenchNamedDays(
          new ScheduleDtoBuilder()
            .withEmptyComplexSchedule({
              start: new Date(2022, 6, 13),
              end: new Date(2022, 6, 19),
            })
            .build(),
        ),
      ).toEqual([]);
      expect(convertToFrenchNamedDays(complexSchedule())).toEqual([
        "lundi",
        "jeudi",
        "dimanche",
      ]);
    });

    it("converts simple schedule", () => {
      expect(
        convertToFrenchNamedDays(
          new ScheduleDtoBuilder().withEmptyRegularSchedule().build(),
        ),
      ).toEqual([]);
      expect(convertToFrenchNamedDays(regularSchedule())).toEqual([
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
      const regularScheduleClassic = new ScheduleDtoBuilder()
        .withEmptyComplexSchedule({
          start: new Date("2022-06-04"),
          end: new Date("2022-06-28"),
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

      it("give hours time when immersion last only one day", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-06-13",
          dateEnd: "2022-06-13",
          schedule: regularScheduleClassic,
        });
        expect(totalHours).toBe(7.5);
      });

      it("has no hours if the day is out of immersion date range", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-06-03",
          dateEnd: "2022-06-03",
          schedule: regularScheduleClassic,
        });
        expect(totalHours).toBe(0);
      });

      it("has no hours if the day is not one of the worked day", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-06-12",
          dateEnd: "2022-06-12",
          schedule: regularScheduleClassic,
        });
        expect(totalHours).toBe(0);
      });

      it("calculate the some of days worked on same week", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-06-13",
          dateEnd: "2022-06-19",
          schedule: regularScheduleClassic,
        });
        expect(totalHours).toBe(22.5);
      });

      it("calculate the some of days worked even on several weeks", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-06-04",
          dateEnd: "2022-06-20",
          schedule: regularScheduleClassic,
        });
        expect(totalHours).toBe(52.5);
      });
    });

    describe("with complex schedule", () => {
      const complexSchedule = new ScheduleDtoBuilder()
        .withComplexSchedule([
          makeDailySchedule(new Date("2022-06-13"), [
            { start: "08:00", end: "12:00" },
          ]),
          makeDailySchedule(new Date("2022-06-14"), []),
          makeDailySchedule(new Date("2022-06-15"), []),
          makeDailySchedule(new Date("2022-06-16"), [
            { start: "06:00", end: "12:00" },
            { start: "18:00", end: "22:00" },
          ]),
          makeDailySchedule(new Date("2022-06-17"), []),
          makeDailySchedule(new Date("2022-06-18"), []),
          makeDailySchedule(new Date("2022-06-19"), [
            { start: "02:00", end: "06:00" },
            { start: "07:00", end: "10:00" },
            { start: "19:00", end: "21:00" },
          ]),
          makeDailySchedule(new Date("2022-06-20"), [
            { start: "08:00", end: "12:00" },
          ]),
          makeDailySchedule(new Date("2022-06-21"), []),
          makeDailySchedule(new Date("2022-06-22"), []),
          makeDailySchedule(new Date("2022-06-23"), [
            { start: "06:00", end: "12:00" },
            { start: "18:00", end: "22:00" },
          ]),
          makeDailySchedule(new Date("2022-06-24"), []),
          makeDailySchedule(new Date("2022-06-25"), [
            { start: "07:00", end: "11:00" },
          ]),
          makeDailySchedule(new Date("2022-06-26"), [
            { start: "02:00", end: "06:00" },
            { start: "07:00", end: "10:00" },
            { start: "19:00", end: "21:00" },
          ]),
        ])
        .build();

      it("give day hours when immersion last only one day", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-06-13",
          dateEnd: "2022-06-13",
          schedule: complexSchedule,
        });
        expect(totalHours).toBe(4);
      });

      it("has no hours if the day is not one of the worked day", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-06-18",
          dateEnd: "2022-06-18",
          schedule: complexSchedule,
        });
        expect(totalHours).toBe(0);
      });

      it("calculate the some of days worked", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-06-13",
          dateEnd: "2022-06-19",
          schedule: complexSchedule,
        });
        expect(totalHours).toBe(23);
      });

      it("calculate the some of days worked even on several weeks", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-06-13",
          dateEnd: "2022-06-26",
          schedule: complexSchedule,
        });
        expect(totalHours).toBe(50);
      });
    });
    describe("with complex schedule that return 0 if bad date string format", () => {
      const complexSchedule = new ScheduleDtoBuilder()
        .withEmptyComplexSchedule({
          start: new Date("2022-06-13"),
          end: new Date("2022-07-11"),
        })
        .withRegularSchedule({
          dayPeriods: [[0, 4]],
          timePeriods: [
            { end: "12:00", start: "08:00" },
            { end: "16:40", start: "14:00" },
          ],
        })
        .build();

      it("has 140 hours with good date format.", () => {
        const totalHours = calculateTotalImmersionHoursBetweenDate({
          dateStart: "2022-06-13",
          dateEnd: "2022-07-11",
          schedule: complexSchedule,
        });
        expect(totalHours).toBe(140);
      });
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
          .withEmptyComplexSchedule(dateInterval)
          .build();
        expect(dayPeriodsFromComplexSchedule(schedule.complexSchedule)).toEqual(
          [],
        );
      });
      it(`dayperiods '${JSON.stringify([])}'`, () => {
        const schedule = new ScheduleDtoBuilder()
          .withEmptyComplexSchedule(dateInterval)
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
            .withEmptyComplexSchedule(dateInterval)
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
            .withEmptyComplexSchedule(dateInterval)
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
            .withEmptyComplexSchedule(dateInterval)
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

  describe("schemas", () => {
    it("isoStringSchema parse", () => {
      expect(() => isoStringSchema.parse("Not a date")).toThrow(
        "Invalid time value",
      );
      expect(() => isoStringSchema.parse("31-07-2022")).toThrow(
        "Invalid time value",
      );
      expect(isoStringSchema.parse("2022-07-05")).toEqual(
        new Date("2022-07-05").toISOString(),
      );
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
