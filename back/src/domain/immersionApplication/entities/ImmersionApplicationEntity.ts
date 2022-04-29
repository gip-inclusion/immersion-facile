import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { immersionApplicationSchema } from "shared/src/ImmersionApplication/immersionApplication.schema";

export class ImmersionApplicationEntity {
  private constructor(public readonly properties: ImmersionApplicationDto) {}

  public static create(dto: ImmersionApplicationDto) {
    immersionApplicationSchema.parse(dto);
    return new ImmersionApplicationEntity(dto);
  }

  public toDto() {
    return this.properties;
  }

  public get id() {
    return this.properties.id;
  }

  public get agencyId() {
    return this.properties.agencyId;
  }

  public get status() {
    return this.properties.status;
  }
}
