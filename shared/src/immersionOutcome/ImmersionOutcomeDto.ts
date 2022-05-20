export type OutcomeStatus = typeof outcomeStatuses[number];
export const outcomeStatuses = ["ABANDONED", "FINISHED"] as const;

export interface ImmersionOutcomeDto {
  id: string;
  status: OutcomeStatus;
  establishmentFeedback: string;
  conventionId: string;
}
