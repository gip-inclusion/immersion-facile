import { ConventionDto, ConventionId } from "shared";

export interface ConventionRepository {
  save: (conventionDto: ConventionDto) => Promise<void>;
  getById: (id: ConventionId) => Promise<ConventionDto | undefined>;
  update: (conventionDto: ConventionDto) => Promise<ConventionId | undefined>;
}
