import {
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "../../../shared/ImmersionApplicationDto";

export class ImmersionApplicationEntity {
  private constructor(private readonly properties: ImmersionApplicationDto) {}

  public static create(dto: ImmersionApplicationDto) {
    immersionApplicationSchema.validateSync(dto);
    return new ImmersionApplicationEntity(dto);
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
  entity: ImmersionApplicationEntity | undefined,
): entity is ImmersionApplicationEntity => {
  return !!entity;
};
