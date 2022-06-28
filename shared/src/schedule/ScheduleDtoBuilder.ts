import { Builder } from "../Builder";
import type {
  ComplexScheduleDto,
  DateInterval,
  ScheduleDto,
  RegularScheduleDto,
} from "./ScheduleSchema";
import { emptySchedule } from "./ScheduleSchema";
import {
  complexScheduleFromRegularSchedule,
  emptyRegularSchedule,
} from "./ScheduleUtils";

const defaultInterval: DateInterval = {
  start: new Date("2022-06-13"),
  end: new Date("2022-06-19"),
};

export class ScheduleDtoBuilder implements Builder<ScheduleDto> {
  constructor(private dto: ScheduleDto = emptySchedule(defaultInterval)) {}

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
      isSimple: true,
      complexSchedule,
    });
  }

  public withEmptyComplexSchedule(interval: DateInterval): ScheduleDtoBuilder {
    return this.withComplexSchedule(emptySchedule(interval).complexSchedule);
  }

  public withComplexSchedule(
    complexSchedule: ComplexScheduleDto,
  ): ScheduleDtoBuilder {
    return new ScheduleDtoBuilder({
      ...this.dto,
      isSimple: false,
      complexSchedule,
    });
  }

  public build() {
    return this.dto;
  }
}
