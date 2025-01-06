import { ConventionId } from "../convention/convention.dto";
import { ExtractFromExisting } from "../utils";
import { DateString } from "../utils/date";

export type AssessmentStatus = (typeof assessmentStatuses)[number];
export const assessmentStatuses = [
  "COMPLETED",
  "PARTIALLY_COMPLETED",
  "DID_NOT_SHOW",
] as const;
export const typeOfContracts = [
  "CDI",
  "CDD > ou = 6 mois",
  "CDD < 6 mois",
  "Alternance",
  "Contrat aidé",
  "Contrat d'insertion",
  "Autre",
] as const;
export type TypeOfContract = (typeof typeOfContracts)[number];

export type WithAssessmentStatus =
  | {
      status: ExtractFromExisting<
        AssessmentStatus,
        "COMPLETED" | "DID_NOT_SHOW"
      >;
    }
  | {
      status: ExtractFromExisting<AssessmentStatus, "PARTIALLY_COMPLETED">;
      lastDayOfPresence: DateString | null;
      numberOfMissedHours: number;
    };

export type WithEndedWithAJob =
  | { endedWithAJob: false }
  | {
      endedWithAJob: true;
      typeOfContract: TypeOfContract;
      contractStartDate: DateString;
    };

export type WithEstablishmentComments = {
  establishmentFeedback: string;
  establishmentAdvices: string;
};

export type AssessmentDto = {
  conventionId: ConventionId;
} & WithAssessmentStatus &
  WithEndedWithAJob &
  WithEstablishmentComments;

export type WithAssessmentDto = {
  assessment: AssessmentDto;
};

export type DateRange = {
  from: Date;
  to: Date;
};
