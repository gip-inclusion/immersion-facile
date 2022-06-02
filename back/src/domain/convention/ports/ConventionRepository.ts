import {
  ConventionDto,
  ConventionExternalId,
  ConventionId,
} from "shared/src/convention/convention.dto";

export interface ConventionRepository {
  save: (
    conventionDto: ConventionDto,
  ) => Promise<ConventionExternalId | undefined>;
  getById: (id: ConventionId) => Promise<ConventionDto | undefined>;
  update: (conventionDto: ConventionDto) => Promise<ConventionId | undefined>;
}
