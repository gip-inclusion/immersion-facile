import { ImmersionApplicationId } from "../ImmersionApplication/ImmersionApplication.dto";
import { Flavor } from "../typeFlavors";

export type AssessmentStatus = typeof assessmentStatuses[number];
export const assessmentStatuses = ["ABANDONED", "FINISHED"] as const;

type ImmersionAssessmentId = Flavor<string, "ImmersionAssessmentId">;

export interface ImmersionAssessmentDto {
  id: ImmersionAssessmentId;
  status: AssessmentStatus;
  establishmentFeedback: string;
  conventionId: ImmersionApplicationId;
}
