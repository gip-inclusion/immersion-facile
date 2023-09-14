import { ConventionExternalId, ConventionId } from "shared";

export interface ConventionExternalIdRepository {
  save: (conventionId: ConventionId) => Promise<void>;
  getByConventionId: (
    conventionId: ConventionId,
  ) => Promise<ConventionExternalId | undefined>;
}
