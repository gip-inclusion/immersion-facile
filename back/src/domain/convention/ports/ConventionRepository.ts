/* eslint-disable @typescript-eslint/require-await */
import { ConventionDto, ConventionId } from "shared";

export interface ConventionRepository {
  save: (conventionDto: ConventionDto) => Promise<void>;
  getById: (id: ConventionId) => Promise<ConventionDto | undefined>;
  update: (conventionDto: ConventionDto) => Promise<ConventionId | undefined>;
  deprecateConventionsWithoutDefinitiveStatusEndedSince: (
    endedSince: Date,
  ) => Promise<void>;
}
