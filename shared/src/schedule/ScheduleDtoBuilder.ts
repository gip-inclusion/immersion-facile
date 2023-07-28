import { z } from "zod";
import { Builder } from "../Builder";
import { DailyScheduleDto, DateIntervalDto, ScheduleDto } from "./Schedule.dto";
import {
  selectedDaysOfTheWeekSchema,
  timePeriodsSchema,
} from "./Schedule.schema";
import {
  calculateNumberOfWorkedDays,
  calculateTotalImmersionHoursFromComplexSchedule,
  emptySchedule,
  frenchDayMapping,
} from "./ScheduleUtils";

const emptyRegularSchedule: RegularScheduleDto = {
  selectedDays: [0, 1, 2, 3, 4, 5, 6],
  timePeriods: [],
};

const complexScheduleFromRegularSchedule = (
  complexSchedule: DailyScheduleDto[],
  { selectedDays, timePeriods }: RegularScheduleDto,
) =>
  complexSchedule
    .filter((day) =>
      selectedDays.includes(frenchDayMapping(day.date).frenchDay),
    )
    .map((day) => ({
      date: day.date,
      timePeriods,
    }));

// Represents a schedule where each day is worked on the same
// schedule, with any combinations of workdays.
const regularScheduleSchema = z.object({
  selectedDays: selectedDaysOfTheWeekSchema,
  timePeriods: timePeriodsSchema,
});

type RegularScheduleDto = z.infer<typeof regularScheduleSchema>;

export const defaultInterval: DateIntervalDto = {
  start: new Date("2022-06-13"),
  end: new Date("2022-06-19"),
};

export class ScheduleDtoBuilder implements Builder<ScheduleDto> {
  constructor(private dto: ScheduleDto = emptySchedule(defaultInterval)) {}

  public build() {
    return this.dto;
  }

  public withComplexSchedule(
    complexSchedule: DailyScheduleDto[],
  ): ScheduleDtoBuilder {
    return new ScheduleDtoBuilder({
      ...this.dto,
      isSimple: false,
      complexSchedule,
    });
  }

  public withDateInterval(interval: DateIntervalDto): ScheduleDtoBuilder {
    return this.withComplexSchedule(emptySchedule(interval).complexSchedule);
  }

  public withEmptyRegularSchedule(): ScheduleDtoBuilder {
    return this.withRegularSchedule(emptyRegularSchedule);
  }

  public withRegularSchedule(
    regularSchedule: RegularScheduleDto,
  ): ScheduleDtoBuilder {
    const complexSchedule = complexScheduleFromRegularSchedule(
      this.dto.complexSchedule,
      regularSchedule,
    );

    return new ScheduleDtoBuilder({
      ...this.dto,
      workedDays: calculateNumberOfWorkedDays(complexSchedule),
      totalHours:
        calculateTotalImmersionHoursFromComplexSchedule(complexSchedule),
      isSimple: true,
      complexSchedule,
    });
  }

  public withTotalHours(totalHours: number) {
    return new ScheduleDtoBuilder({ ...this.dto, totalHours });
  }

  public withWorkedDays(workedDays: number) {
    return new ScheduleDtoBuilder({ ...this.dto, workedDays });
  }
}
