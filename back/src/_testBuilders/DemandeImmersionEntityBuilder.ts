import { DemandeImmersionEntity } from "../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { Builder } from "./Builder";
import { DemandeImmersionDtoBuilder } from "./DemandeImmersionDtoBuilder";

export class DemandeImmersionEntityBuilder
  implements Builder<DemandeImmersionEntity>
{
  constructor(
    private entity: DemandeImmersionEntity = DemandeImmersionEntity.create(
      new DemandeImmersionDtoBuilder().build(),
    ),
  ) {}

  public build() {
    return this.entity;
  }
}
