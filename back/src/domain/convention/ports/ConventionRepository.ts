import { ConventionId } from "shared/src/convention/convention.dto";
import { ConventionEntity } from "../entities/ConventionEntity";

export interface ConventionRepository {
  save: (
    conventionEntity: ConventionEntity,
  ) => Promise<ConventionId | undefined>;
  getById: (id: ConventionId) => Promise<ConventionEntity | undefined>;
  update: (
    conventionEntity: ConventionEntity,
  ) => Promise<ConventionId | undefined>;
}
