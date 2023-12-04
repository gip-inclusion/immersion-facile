/* eslint-disable @typescript-eslint/require-await */
import { ConventionDto, ConventionId, Email } from "shared";

export interface ConventionRepository {
  getIdsByEstablishmentRepresentativeEmail(
    email: Email,
  ): Promise<ConventionId[]>;
  getIdsByEstablishmentTutorEmail(email: Email): Promise<ConventionId[]>;
  save: (conventionDto: ConventionDto) => Promise<void>;
  getById: (id: ConventionId) => Promise<ConventionDto | undefined>;
  update: (conventionDto: ConventionDto) => Promise<ConventionId | undefined>;
  deprecateConventionsWithoutDefinitiveStatusEndedSince: (
    endedSince: Date,
  ) => Promise<number>;
}
