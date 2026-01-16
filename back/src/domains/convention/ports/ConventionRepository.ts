import type { ConventionDto, ConventionId, DateString } from "shared";

export interface ConventionRepository {
  save: (
    conventionDto: ConventionDto,
    beneficiaryPhoneId: number,
    establishmentTutorPhoneId: number,
    establishmentRepresentativePhoneId: number,
    beneficiaryRepresentativePhoneId: number,
    beneficiaryCurrentEmployerPhoneId: number,
    now?: DateString,
  ) => Promise<void>;
  getById: (id: ConventionId) => Promise<ConventionDto | undefined>;
  update: (
    conventionDto: ConventionDto,
    beneficiaryPhoneId: number,
    establishmentTutorPhoneId: number,
    establishmentRepresentativePhoneId: number,
    beneficiaryRepresentativePhoneId: number,
    beneficiaryCurrentEmployerPhoneId: number,
    now?: DateString,
  ) => Promise<ConventionId | undefined>;
  deprecateConventionsWithoutDefinitiveStatusEndedSince: (
    endedSince: Date,
    now?: DateString,
  ) => Promise<ConventionId[]>;
  deleteOldConventions: (params: {
    updatedBefore: Date;
  }) => Promise<ConventionId[]>;
}
