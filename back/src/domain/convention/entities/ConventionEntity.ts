import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";
import { validateAndParseZodSchema } from "../../../adapters/primary/helpers/httpErrors";

export class ConventionEntity {
  private constructor(public readonly properties: ConventionDto) {}

  public static create(dto: ConventionDto) {
    const entity = validateAndParseZodSchema(conventionSchema, dto);
    return new ConventionEntity(entity);
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
