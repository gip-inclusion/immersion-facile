import {
  ComplexScheduleDto,
  ScheduleDto,
  SimpleScheduleDto,
} from "shared/src/ScheduleSchema";
import { emptySchedule } from "shared/src/ScheduleSchema";
import { Builder } from "./Builder";
export class ScheduleDtoBuilder implements Builder<ScheduleDto> {
  constructor(private dto: ScheduleDto = emptySchedule) {}

  public withEmptySimpleSchedule(): ScheduleDtoBuilder {
    return this.withSimpleSchedule(emptySchedule.simpleSchedule);
  }

  public withSimpleSchedule(
    simpleSchedule: SimpleScheduleDto,
  ): ScheduleDtoBuilder {
    return new ScheduleDtoBuilder({
      ...this.dto,
      isSimple: true,
      simpleSchedule,
    });
  }

  public withEmptyComplexSchedule(): ScheduleDtoBuilder {
    return this.withComplexSchedule(emptySchedule.complexSchedule);
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
