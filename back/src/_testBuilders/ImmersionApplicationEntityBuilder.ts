import { AgencyId } from "shared/src/agency/agency.dto";
import { ImmersionApplicationEntity } from "../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { Builder } from "shared/src/Builder";
import { ImmersionApplicationDtoBuilder } from "shared/src/ImmersionApplication/ImmersionApplicationDtoBuilder";
import { ScheduleDto } from "shared/src/schedule/ScheduleSchema";
import {
  ApplicationStatus,
  ImmersionApplicationId,
} from "shared/src/ImmersionApplication/ImmersionApplication.dto";

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

  public withEmail(email: string) {
    return new ImmersionApplicationEntityBuilder(
      ImmersionApplicationEntity.create(
        new ImmersionApplicationDtoBuilder(this.entity.toDto())
          .withEmail(email)
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

  public withStatus(status: ApplicationStatus) {
    return new ImmersionApplicationEntityBuilder(
      ImmersionApplicationEntity.create(
        new ImmersionApplicationDtoBuilder(this.entity.toDto())
          .withStatus(status)
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
