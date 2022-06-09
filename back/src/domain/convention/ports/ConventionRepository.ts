import {
  ConventionDto,
  ConventionId,
} from "shared/src/convention/convention.dto";

export interface ConventionRepository {
  save: (conventionDto: ConventionDto) => Promise<ConventionId | undefined>;
  getById: (id: ConventionId) => Promise<ConventionDto | undefined>;
  update: (conventionDto: ConventionDto) => Promise<ConventionId | undefined>;
}
