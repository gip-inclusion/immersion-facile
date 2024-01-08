import { MatchRangeDto } from "shared";

export type SliceOfString = {
  startIndexInclusive: number;
  endIndexExclusive: number;
  bolded: boolean;
};

export const highlightStringsFromMatches = (
  matchRanges: MatchRangeDto[],
  description: string,
): SliceOfString[] => {
  const result: SliceOfString[] = [];
  const matchRangesWithoutOverlaps = mergeOverlappingMatchRanges(
    matchRanges,
    description.length,
  );
  let prevEndIndex = 0;

  for (let i = 0; i < matchRangesWithoutOverlaps.length; i++) {
    const matchRange = matchRangesWithoutOverlaps[i];

    if (matchRange.startIndexInclusive !== prevEndIndex) {
      result.push({
        bolded: false,
        startIndexInclusive: prevEndIndex,
        endIndexExclusive: matchRange.startIndexInclusive,
      });
    }
    result.push({
      bolded: true,
      ...matchRange,
    });
    prevEndIndex = matchRange.endIndexExclusive;
  }

  const lastResult = result[result.length - 1] ?? [];
  if (lastResult && lastResult.endIndexExclusive !== description.length) {
    result.push({
      bolded: false,
      startIndexInclusive: prevEndIndex,
      endIndexExclusive: description.length,
    });
  }

  return result;
};

const mergeOverlappingMatchRanges = (
  matchRanges: MatchRangeDto[],
  lengthOfDescription: number,
): MatchRangeDto[] => {
  const result: MatchRangeDto[] = [];
  for (let i = 0; i < lengthOfDescription; i++) {
    const isBold = matchRanges.some(
      (matchRange) =>
        matchRange.startIndexInclusive <= i && i < matchRange.endIndexExclusive,
    );

    if (isBold) {
      const lastMatchRange = result[result.length - 1];
      if (lastMatchRange && lastMatchRange.endIndexExclusive === i) {
        lastMatchRange.endIndexExclusive++;
      } else {
        result.push({ startIndexInclusive: i, endIndexExclusive: i + 1 });
      }
    }
  }

  return result;
};
