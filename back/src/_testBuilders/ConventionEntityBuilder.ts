import { AgencyId } from "shared/src/agency/agency.dto";
import { ConventionEntity } from "../domain/convention/entities/ConventionEntity";
import { Builder } from "shared/src/Builder";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { ScheduleDto } from "shared/src/schedule/ScheduleSchema";
import {
  ConventionStatus,
  ConventionId,
} from "shared/src/convention/convention.dto";

export class ConventionEntityBuilder implements Builder<ConventionEntity> {
  constructor(
    private entity: ConventionEntity = ConventionEntity.create(
      new ConventionDtoBuilder().build(),
    ),
  ) {}

  public withId(id: ConventionId) {
    return new ConventionEntityBuilder(
      ConventionEntity.create(
        new ConventionDtoBuilder(this.entity.toDto()).withId(id).build(),
      ),
    );
  }

  public withEmail(email: string) {
    return new ConventionEntityBuilder(
      ConventionEntity.create(
        new ConventionDtoBuilder(this.entity.toDto()).withEmail(email).build(),
      ),
    );
  }

  public withAgencyId(id: AgencyId) {
    return new ConventionEntityBuilder(
      ConventionEntity.create(
        new ConventionDtoBuilder(this.entity.toDto()).withAgencyId(id).build(),
      ),
    );
  }

  public withStatus(status: ConventionStatus) {
    return new ConventionEntityBuilder(
      ConventionEntity.create(
        new ConventionDtoBuilder(this.entity.toDto())
          .withStatus(status)
          .build(),
      ),
    );
  }
  public validated() {
    return new ConventionEntityBuilder(
      ConventionEntity.create(
        new ConventionDtoBuilder(this.entity.toDto())
          .withStatus("ACCEPTED_BY_VALIDATOR")
          .build(),
      ),
    );
  }
  public withSchedule(schedule: ScheduleDto) {
    return new ConventionEntityBuilder(
      ConventionEntity.create(
        new ConventionDtoBuilder(this.entity.toDto())
          .withSchedule(schedule)
          .build(),
      ),
    );
  }
  public withoutWorkCondition() {
    return new ConventionEntityBuilder(
      ConventionEntity.create(
        new ConventionDtoBuilder(this.entity.toDto())
          .withoutWorkCondition()
          .build(),
      ),
    );
  }

  public withDateStartAndDateEnd(dateStart: string, dateEnd: string) {
    return new ConventionEntityBuilder(
      ConventionEntity.create({
        ...this.entity.toDto(),
        dateEnd,
        dateStart,
      }),
    );
  }

  public build() {
    return this.entity;
  }
}
