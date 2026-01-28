import type { ConventionId } from "../convention/convention.dto";
import type { DateString } from "../utils/date";

export type AssessmentStatus = AssessmentDto["status"];
export const assessmentStatuses: AssessmentStatus[] = [
  "COMPLETED",
  "PARTIALLY_COMPLETED",
  "DID_NOT_SHOW",
] as const;
export type LegacyAssessmentStatus = (typeof legacyAssessmentStatuses)[number];
export const legacyAssessmentStatuses = ["FINISHED", "ABANDONED"] as const;
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

type CommonAssessmentFields = {
  conventionId: ConventionId;
} & WithEndedWithAJob &
  WithEstablishmentComments;

export type AssessmentDtoCompleted = CommonAssessmentFields & {
  status: "COMPLETED";
};

export type AssessmentDtoDidNotShow = CommonAssessmentFields & {
  status: "DID_NOT_SHOW";
};

export type AssessmentDtoPartiallyCompleted = CommonAssessmentFields & {
  status: "PARTIALLY_COMPLETED";
  lastDayOfPresence: DateString | undefined;
  numberOfMissedHours: number;
};

export type AssessmentDto =
  | AssessmentDtoCompleted
  | AssessmentDtoDidNotShow
  | AssessmentDtoPartiallyCompleted;

export type WithAssessmentDto = {
  assessment: AssessmentDto;
};

export type DeleteAssessmentRequestDto = {
  conventionId: ConventionId;
  deleteAssessmentJustification: string;
};

export type AssessmentMode = "CreateAssessment" | "GetAssessment";

export type LegacyAssessmentDto = {
  status: LegacyAssessmentStatus;
  conventionId: ConventionId;
  establishmentFeedback: string;
};

export type CreateFormAssessmentInitialValues = {
  conventionId: ConventionId;
} & (WithEndedWithAJob | { endedWithAJob: null }) &
  WithEstablishmentComments & { status: null };

export type FormAssessmentDto =
  | AssessmentDto
  | CreateFormAssessmentInitialValues;
