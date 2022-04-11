import { AgencyId } from "../shared/agency/agency.dto";
import { ImmersionApplicationEntity } from "../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { Builder } from "./Builder";
import { ImmersionApplicationDtoBuilder } from "./ImmersionApplicationDtoBuilder";
import { ScheduleDto } from "../shared/ScheduleSchema";
import { ImmersionApplicationId } from "../shared/ImmersionApplication/ImmersionApplication.dto";

export class ImmersionApplicationEntityBuilder
  implements Builder<ImmersionApplicationEntity>
{
  constructor(
    private entity: ImmersionApplicationEntity = ImmersionApplicationEntity.create(
      new ImmersionApplicationDtoBuilder().build(),
    ),
  ) {}

  public withId(id: ImmersionApplicationId) {
    return new ImmersionApplicationEntityBuilder(
      ImmersionApplicationEntity.create(
        new ImmersionApplicationDtoBuilder(this.entity.toDto())
          .withId(id)
          .build(),
      ),
    );
  }

  public withAgencyId(id: AgencyId) {
    return new ImmersionApplicationEntityBuilder(
      ImmersionApplicationEntity.create(
        new ImmersionApplicationDtoBuilder(this.entity.toDto())
          .withAgencyId(id)
          .build(),
      ),
    );
  }

  public withSchedule(schedule: ScheduleDto) {
    return new ImmersionApplicationEntityBuilder(
      ImmersionApplicationEntity.create(
        new ImmersionApplicationDtoBuilder(this.entity.toDto())
          .withSchedule(schedule)
          .build(),
      ),
    );
  }
  public withoutWorkCondition() {
    return new ImmersionApplicationEntityBuilder(
      ImmersionApplicationEntity.create(
        new ImmersionApplicationDtoBuilder(this.entity.toDto())
          .withoutWorkCondition()
          .build(),
      ),
    );
  }

  public build() {
    return this.entity;
  }
}
