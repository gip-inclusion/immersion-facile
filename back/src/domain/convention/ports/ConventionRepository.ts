import {
  ConventionDto,
  ConventionDtoWithoutExternalId,
  ConventionExternalId,
  ConventionId,
} from "shared/src/convention/convention.dto";

export interface ConventionRepository {
  save: (
    conventionDto: ConventionDtoWithoutExternalId,
  ) => Promise<ConventionExternalId | undefined>;
  getById: (id: ConventionId) => Promise<ConventionDto | undefined>;
  update: (conventionDto: ConventionDto) => Promise<ConventionId | undefined>;
}
