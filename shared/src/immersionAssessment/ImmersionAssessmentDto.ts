export type AssessmentStatus = typeof assessmentStatuses[number];
export const assessmentStatuses = ["ABANDONED", "FINISHED"] as const;

export interface ImmersionAssessmentDto {
  id: string;
  status: AssessmentStatus;
  establishmentFeedback: string;
  conventionId: string;
}
