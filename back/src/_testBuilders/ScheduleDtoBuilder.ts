import {
  ComplexScheduleDto,
  ScheduleDto,
  SimpleScheduleDto,
} from "../shared/ScheduleSchema";
import { Builder } from "./Builder";

const emptySimpleSchedule: SimpleScheduleDto = { dayPeriods: [], hours: [] };

const emptyComplexSchedule: ComplexScheduleDto = [[], [], [], [], [], [], []];

const emptySchedule: ScheduleDto = {
  isSimple: false,
  selectedIndex: 0,
  complexSchedule: emptyComplexSchedule,
  simpleSchedule: emptySimpleSchedule,
};

export class ScheduleDtoBuilder implements Builder<ScheduleDto> {
  constructor(private dto: ScheduleDto = emptySchedule) {}

  public withEmptySimpleSchedule(): ScheduleDtoBuilder {
    return this.withSimpleSchedule(emptySimpleSchedule);
  }

  public withSimpleSchedule(
    simpleSchedule: SimpleScheduleDto
  ): ScheduleDtoBuilder {
    return new ScheduleDtoBuilder({
      ...this.dto,
      isSimple: true,
      simpleSchedule,
    });
  }

  public withEmptyComplexSchedule(): ScheduleDtoBuilder {
    return this.withComplexSchedule(emptyComplexSchedule);
  }

  public withComplexSchedule(
    complexSchedule: ComplexScheduleDto
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
