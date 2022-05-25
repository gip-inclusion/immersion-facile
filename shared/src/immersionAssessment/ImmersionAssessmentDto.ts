import { ImmersionApplicationId } from "../ImmersionApplication/ImmersionApplication.dto";

export type AssessmentStatus = typeof assessmentStatuses[number];
export const assessmentStatuses = ["ABANDONED", "FINISHED"] as const;

export interface ImmersionAssessmentDto {
  conventionId: ImmersionApplicationId;
  status: AssessmentStatus;
  establishmentFeedback: string;
}
