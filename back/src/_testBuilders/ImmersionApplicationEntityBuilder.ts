import { ImmersionApplicationEntity } from "../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ImmersionApplicationId } from "../shared/ImmersionApplicationDto";
import { Builder } from "./Builder";
import { ImmersionApplicationDtoBuilder } from "./ImmersionApplicationDtoBuilder";

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
        new ImmersionApplicationDtoBuilder().withId(id).build(),
      ),
    );
  }

  public build() {
    return this.entity;
  }
}
