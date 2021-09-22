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

  public get id() {
    return this.properties.id;
  }

  public get source() {
    return this.properties.source;
  }
}

export const isDemandeImmersionEntity = (
  entity: DemandeImmersionEntity | undefined,
): entity is DemandeImmersionEntity => {
  return !!entity;
};
