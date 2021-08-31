import {
  DemandeImmersionDto,
  demandeImmersionDtoSchema,
} from "../../../shared/DemandeImmersionDto";

export class DemandeImmersionEntity {
  private constructor(private readonly properties: DemandeImmersionDto) {}

  public static create(dto: DemandeImmersionDto) {
    demandeImmersionDtoSchema.validateSync(dto);
    return new DemandeImmersionEntity(dto);
  }

  public toDto() {
    return this.properties;
  }

  public id() {
    return this.properties.id;
  }
}
