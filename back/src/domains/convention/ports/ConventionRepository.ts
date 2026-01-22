import type { ConventionDto, ConventionId, DateString } from "shared";

export interface ConventionRepository {
  save: (params: {
    conventionDto: ConventionDto;
    phoneIds: ConventionPhoneIds;
    now?: DateString;
  }) => Promise<void>;
  getById: (id: ConventionId) => Promise<ConventionDto | undefined>;
  update: (params: {
    conventionDto: ConventionDto;
    phoneIds: ConventionPhoneIds;
    now?: DateString;
  }) => Promise<ConventionId | undefined>;
  deprecateConventionsWithoutDefinitiveStatusEndedSince: (
    endedSince: Date,
    now?: DateString,
  ) => Promise<ConventionId[]>;
  deleteOldConventions: (params: {
    updatedBefore: Date;
  }) => Promise<ConventionId[]>;
}

export type ConventionPhoneIds = {
  beneficiary: number;
  establishmentRepresentative: number;
  establishmentTutor: number;
} & Partial<{
  beneficiaryRepresentative: number;
  beneficiaryCurrentEmployer: number;
}>;
