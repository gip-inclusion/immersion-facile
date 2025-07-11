import type {
  ConventionDto,
  ConventionId,
  DateRange,
  DateString,
  Email,
} from "shared";

export interface ConventionRepository {
  getIdsByEstablishmentRepresentativeEmail(
    email: Email,
  ): Promise<ConventionId[]>;
  getIdsByEstablishmentTutorEmail(email: Email): Promise<ConventionId[]>;
  getIdsValidatedByEndDateAround: (endDate: Date) => Promise<ConventionId[]>;
  getValidatedEndedOrUpdatedAround: (
    finishingRange: DateRange,
  ) => Promise<ConventionDto[]>;
  save: (conventionDto: ConventionDto, now?: DateString) => Promise<void>;
  getById: (id: ConventionId) => Promise<ConventionDto | undefined>;
  update: (
    conventionDto: ConventionDto,
    now?: DateString,
  ) => Promise<ConventionId | undefined>;
  deprecateConventionsWithoutDefinitiveStatusEndedSince: (
    endedSince: Date,
  ) => Promise<number>;
}
