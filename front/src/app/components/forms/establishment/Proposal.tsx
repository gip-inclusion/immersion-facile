type MatchRange = {
  startIndexInclusive: number;
  endIndexExclusive: number;
};
export type Proposal<T> = {
  description: string;
  value: T;
  matchRanges: MatchRange[];
};
