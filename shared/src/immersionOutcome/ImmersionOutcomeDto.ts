export type OutcomeStatus = typeof outcomeStatuses[number];
export const outcomeStatuses = ["ABANDONNED", "FINISHED"] as const;

export interface ImmersionOutcomeDto {
  id: string;
  status: OutcomeStatus;
  establishmentFeedback: string;
  immersionApplicationId: string;
}
