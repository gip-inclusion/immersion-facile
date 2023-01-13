import { ConventionId } from "../convention/convention.dto";

export type AssessmentStatus = (typeof assessmentStatuses)[number];
export const assessmentStatuses = ["FINISHED", "ABANDONED"] as const;

export interface ImmersionAssessmentDto {
  conventionId: ConventionId;
  status: AssessmentStatus;
  establishmentFeedback: string;
}
