import type { ConventionId } from "../convention/convention.dto";
import type { AppellationAndRomeDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { SiretDto } from "../siret/siret";
import type { Firstname, Lastname } from "../user/user.dto";

export const archivedConventionRequestReasons = [
  "legalDispute",
  "urssafOrInspectionControl",
  "rpeAdvisorAccessToBeneficiaryHistory",
  "other",
] as const;

export type ArchivedConventionRequestReason =
  (typeof archivedConventionRequestReasons)[number];

export type ArchivedConventionRequestReasonFields =
  | {
      reason: Exclude<ArchivedConventionRequestReason, "other">;
      otherReason?: never;
    }
  | {
      reason: Extract<ArchivedConventionRequestReason, "other">;
      otherReason: string;
    };

export type ArchivedConventionRequestWithConventionIdFormDto =
  ArchivedConventionRequestReasonFields & {
    conventionSearchMethod: "withConventionId";
    conventionId: ConventionId;
    beneficiaryFirstName?: never;
    beneficiaryLastName?: never;
    siret?: never;
    immersionDate?: never;
    immersionAppellation?: never;
  };

export type ArchivedConventionRequestWithConventionDetailsFormDto =
  ArchivedConventionRequestReasonFields & {
    conventionSearchMethod: "withConventionDetails";
    conventionId?: never;
    beneficiaryFirstName: Firstname;
    beneficiaryLastName: Lastname;
    siret: SiretDto;
    immersionDate: string;
    immersionAppellation?: AppellationAndRomeDto;
  };

export type ArchivedConventionRequestFormDto =
  | ArchivedConventionRequestWithConventionIdFormDto
  | ArchivedConventionRequestWithConventionDetailsFormDto;
