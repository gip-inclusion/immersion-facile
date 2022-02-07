import { AgencyId } from "../shared/agencies";
import { ImmersionApplicationEntity } from "../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ImmersionApplicationId } from "../shared/ImmersionApplicationDto";
import { Builder } from "./Builder";
import { ImmersionApplicationDtoBuilder } from "./ImmersionApplicationDtoBuilder";
import { ScheduleDto } from "../shared/ScheduleSchema";

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
  public withWorkConditions(workConditions?: string) {
    return new ImmersionApplicationEntityBuilder(
      ImmersionApplicationEntity.create(
        new ImmersionApplicationDtoBuilder(this.entity.toDto())
          .withWorkConditions(workConditions)
          .build(),
      ),
    );
  }

  public build() {
    return this.entity;
  }
}
