import { ConventionId } from "../convention/convention.dto";
import { DateString } from "../utils/date";

export type AssessmentStatus = AssessmentDto["status"];
export const assessmentStatuses: AssessmentStatus[] = [
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

type CommonAssesmentFields = {
  conventionId: ConventionId;
} & WithEndedWithAJob &
  WithEstablishmentComments;

export type AssessmentDtoCompleted = CommonAssesmentFields & {
  status: "COMPLETED";
};

export type AssessmentDtoDidNotShow = CommonAssesmentFields & {
  status: "DID_NOT_SHOW";
};

export type AssessmentDtoPartiallyCompleted = CommonAssesmentFields & {
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

export type DateRange = {
  from: Date;
  to: Date;
};
