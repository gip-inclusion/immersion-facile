import { ConventionId } from "../convention/convention.dto";

export type AssessmentStatus = (typeof assessmentStatuses)[number];
export const assessmentStatuses = ["FINISHED", "ABANDONED"] as const;

export interface AssessmentDto {
  conventionId: ConventionId;
  status: AssessmentStatus;
  establishmentFeedback: string;
}

export type WithAssessmentDto = {
  assessment: AssessmentDto;
};

export type DateRange = {
  from: Date;
  to: Date;
};
