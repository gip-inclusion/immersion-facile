import { ImmersionApplicationEntity } from "../domain/immersionApplication/entities/ImmersionApplicationEntity";
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

  public build() {
    return this.entity;
  }
}
