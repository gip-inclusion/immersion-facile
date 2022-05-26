import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { immersionApplicationSchema } from "shared/src/ImmersionApplication/immersionApplication.schema";
import { validateAndParseZodSchema } from "../../../adapters/primary/helpers/httpErrors";

export class ImmersionApplicationEntity {
  private constructor(public readonly properties: ImmersionApplicationDto) {}

  public static create(dto: ImmersionApplicationDto) {
    const entity = validateAndParseZodSchema(immersionApplicationSchema, dto);
    return new ImmersionApplicationEntity(entity);
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
