import { ConventionId } from "../convention/convention.dto";

export type AssessmentStatus = typeof assessmentStatuses[number];
export const assessmentStatuses = ["ABANDONED", "FINISHED"] as const;

export interface ImmersionAssessmentDto {
  conventionId: ConventionId;
  status: AssessmentStatus;
  establishmentFeedback: string;
}
